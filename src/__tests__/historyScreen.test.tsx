import { api, fail, mockRouter, ok, settle, signIn } from './system/support/harness';
import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import HistoryScreen from '../../app/(tabs)/history';
import { ThemeProvider } from '../theme';
import { darkColors, lightColors } from '../theme/colors';
import { episodeCaption, historyMeta } from '../lib/watchHistory';
import type { WatchHistoryEntry } from '../types/playback';

const entry = (extra: Partial<WatchHistoryEntry> = {}): WatchHistoryEntry => ({
  episodeId: 'ep-1',
  episodeTitle: 'Tập 1',
  episodeNumber: 1,
  thumbnailUrl: null,
  movieId: 'm-1',
  movieTitle: 'Mùa Hạ Trong Gương',
  positionSeconds: 94,
  durationSeconds: 151,
  completed: false,
  lastWatchedAt: '2026-11-24T08:00:00.000Z',
  available: true,
  notice: null,
  ...extra,
});

async function showHistory(theme: 'light' | 'dark' = 'dark') {
  await signIn();
  await render(
    <ThemeProvider initialTheme={theme}>
      <HistoryScreen />
    </ThemeProvider>,
  );
  await settle();
}

const styleOf = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe('Lịch sử xem: card text', () => {
  it('names the episode once, with where the member stopped', () => {
    expect(historyMeta(entry())).toBe('Tập 1 · 1:34 / 2:31');
    expect(historyMeta(entry({ episodeTitle: '  tập 1 ' }))).toBe('Tập 1 · 1:34 / 2:31');
    expect(historyMeta(entry({ episodeTitle: '' }))).toBe('Tập 1 · 1:34 / 2:31');
    expect(historyMeta(entry({ completed: true }))).toBe('Tập 1 · Đã xem hết');
    expect(historyMeta(entry({ durationSeconds: null }))).toBe('Tập 1 · đang ở 1:34');
  });

  it('adds the episode title only when it says more than the number', () => {
    expect(episodeCaption(entry({ episodeTitle: 'Khởi đầu' }))).toBe('Tập 1 · Khởi đầu');
    expect(historyMeta(entry({ episodeTitle: 'Khởi đầu' }))).toBe('Tập 1 · Khởi đầu · 1:34 / 2:31');
  });

  it('says why an episode cannot be opened', () => {
    expect(historyMeta(entry({ available: false, notice: 'Tập đang được chỉnh sửa' }))).toBe('Tập đang được chỉnh sửa');
    expect(historyMeta(entry({ available: false }))).toBe('Tập này tạm không xem được');
  });
});

describe('Lịch sử xem: screen', () => {
  it.each([
    ['dark', darkColors],
    ['light', lightColors],
  ] as const)('draws each card on the %s theme surface with readable text', async (theme, colors) => {
    api.on('GET /playback/history', ok([entry()]));
    await showHistory(theme);
    expect(styleOf('history-card-ep-1')).toMatchObject({ backgroundColor: colors.card, borderColor: colors.border });
    expect(StyleSheet.flatten(screen.getByText('Mùa Hạ Trong Gương').props.style).color).toBe(colors.text);
    expect(StyleSheet.flatten(screen.getByText('Tập 1 · 1:34 / 2:31').props.style).color).toBe(colors.textSecondary);
    expect(screen.queryByText(/Tập 1 · Tập 1/)).toBeNull();
    expect(screen.getByText('62%')).toBeOnTheScreen();
  });

  it('resumes the episode when a card is tapped, and keeps an unavailable one closed', async () => {
    api.on(
      'GET /playback/history',
      ok([entry(), entry({ episodeId: 'ep-2', episodeNumber: 2, episodeTitle: 'Tập 2', available: false, notice: 'Tập đang được chỉnh sửa' })]),
    );
    await showHistory();
    await fireEvent.press(screen.getByLabelText('Mùa Hạ Trong Gương, tập 1'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/watch/[id]', params: { id: 'm-1', episodeId: 'ep-1' } });
    mockRouter.push.mockClear();
    await fireEvent.press(screen.getByLabelText('Mùa Hạ Trong Gương, tập 2'));
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(screen.getByText('Tập đang được chỉnh sửa')).toBeOnTheScreen();
  });

  it('says so when nothing has been watched yet', async () => {
    api.on('GET /playback/history', ok([]));
    await showHistory();
    expect(screen.getByText('Bạn chưa xem phim nào. Lịch sử sẽ hiện ở đây.')).toBeOnTheScreen();
  });

  it('shows the loading state, not the empty text, before the first answer', async () => {
    api.slow('GET /playback/history', ok([]), 50);
    await signIn();
    await render(
      <ThemeProvider>
        <HistoryScreen />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Đang tải lịch sử xem')).toBeOnTheScreen();
    expect(screen.queryByText(/Bạn chưa xem phim nào/)).toBeNull();
    await settle();
    expect(screen.queryByLabelText('Đang tải lịch sử xem')).toBeNull();
  });

  it('shows a load failure with a retry that reads the history again', async () => {
    api.on('GET /playback/history', fail(500, 'boom'), ok([entry()]));
    await showHistory();
    expect(screen.getByText('Hệ thống đang bận. Vui lòng thử lại sau.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Thử lại' }));
    await settle();
    expect(screen.getByText('Mùa Hạ Trong Gương')).toBeOnTheScreen();
    expect(api.called('GET /playback/history')).toHaveLength(2);
  });

  it('asks a guest to sign in', async () => {
    await render(
      <ThemeProvider>
        <HistoryScreen />
      </ThemeProvider>,
    );
    expect(screen.getByText('Đăng nhập để xem lịch sử phim của bạn.')).toBeOnTheScreen();
  });
});
