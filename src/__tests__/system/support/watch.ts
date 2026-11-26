/** The watch screen with a playing episode, as after the member pressed play. */
import { act, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { api, mockRoute, mockVideo, ok, renderApp, settle, type FakePlayer } from './harness';
import { granted, movieRoutes, streamingSession } from './fixtures';
import WatchScreen from '../../../../app/watch/[id]';

export const VTT = 'WEBVTT\n\n00:00.000 --> 00:30.000\nXin chào cả nhà\n';

/** Opens `episodeId` of the movie and presses play; `session` overrides the BE's streaming session. */
export async function playEpisode(episodeId = 'ep-1', session: Record<string, unknown> = {}) {
  movieRoutes();
  api.on(`GET /episodes/${episodeId}/access`, ok(granted(episodeId)));
  api.on('POST /playback/sessions', ok(streamingSession(episodeId, session), 201));
  api.on(`POST /episodes/${episodeId}/views`, ok({ counted: true, viewCount: 341 }));
  api.on('GET /subtitles/sub-vi', { status: 200, body: VTT });
  mockRoute.params = { id: 'm-1', episodeId };
  await renderApp(React.createElement(WatchScreen));
  await settle();
  await fireEvent.press(screen.getByLabelText('Phát tập'));
  await settle();
}

/** The episode's own player (not an ad's). */
export const episodePlayer = (episodeId = 'ep-1'): FakePlayer =>
  mockVideo.players.find((p) => p.source.uri.includes(`/${episodeId}/master.m3u8`))!;

/** Moves the playhead and lets the player clock (read every 250 ms) see it. */
export async function playTo(player: FakePlayer, seconds: number) {
  player.currentTime = seconds;
  await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
}

export const aiLabels = () => screen.queryAllByTestId('ai-label-overlay');
