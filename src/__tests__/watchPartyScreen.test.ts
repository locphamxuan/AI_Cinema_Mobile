import { parseMasterPlaylist, streamUrlFor } from '../lib/hlsQualities';

const MASTER = 'https://api.example/api/playback/s/s1/master.m3u8?s=s1&exp=9&sig=x';
const PLAYLIST = [
  '#EXTM3U',
  '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480',
  'renditions/480p/index.m3u8?s=s1&exp=9&sig=x',
  '#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080',
  'renditions/1080p/index.m3u8?s=s1&exp=9&sig=x',
  '#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720',
  'renditions/720p/index.m3u8?s=s1&exp=9&sig=x',
].join('\n');

describe('watch room quality (BR-69, the Host picks for the room)', () => {
  it('lists the renditions highest first, with their signed URLs resolved against the master', () => {
    const list = parseMasterPlaylist(PLAYLIST, MASTER);
    expect(list.map((r) => r.label)).toEqual(['1080p', '720p', '480p']);
    expect(list[1].url).toBe('https://api.example/api/playback/s/s1/renditions/720p/index.m3u8?s=s1&exp=9&sig=x');
  });

  it('reads the label from RESOLUTION when the folder has no name, and skips broken lines', () => {
    const text = '#EXT-X-STREAM-INF:RESOLUTION=640x360\nlow/index.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1\n';
    expect(parseMasterPlaylist(text, 'https://cdn/x/master.m3u8')).toEqual([
      { label: '360p', height: 360, url: 'https://cdn/x/low/index.m3u8' },
    ]);
    expect(parseMasterPlaylist('', MASTER)).toEqual([]);
  });

  it('plays the master on auto, else the Host rendition or the closest one below it', () => {
    const list = parseMasterPlaylist(PLAYLIST, MASTER);
    expect(streamUrlFor('auto', list, MASTER)).toBe(MASTER);
    expect(streamUrlFor('720p', list, MASTER)).toContain('/720p/');
    // A member whose session lacks the Host's 1440p plays their best one under it.
    expect(streamUrlFor('1440p', list, MASTER)).toContain('/1080p/');
    expect(streamUrlFor('240p', list, MASTER)).toContain('/480p/');
    expect(streamUrlFor('720p', [], MASTER)).toBe(MASTER);
  });
});
