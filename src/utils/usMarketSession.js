/**
 * US equities regular session (NYSE/Nasdaq): Mon–Fri 9:30–16:00 America/New_York.
 * Pre-market: 04:00–09:30, After-hours: 16:00–20:00 ET.
 * Weekends: closed. US market holidays are not modeled (shown as regular weekday hours).
 */

function getEtParts(d) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { hour, minute, weekday };
}

function minutesSinceMidnight(hour, minute) {
  return hour * 60 + minute;
}

export function getUsMarketSession(now = new Date()) {
  const { hour, minute, weekday } = getEtParts(now);
  const t = minutesSinceMidnight(hour, minute);
  const preOpen = minutesSinceMidnight(4, 0);
  const regOpen = minutesSinceMidnight(9, 30);
  const regClose = minutesSinceMidnight(16, 0);
  const ahClose = minutesSinceMidnight(20, 0);

  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const dateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const etTimeLabel = timeFmt.format(now);
  const etDateLabel = dateFmt.format(now);

  const isWeekend = weekday === 0 || weekday === 6;

  let kind = 'closed';
  let label = 'Market closed';

  if (!isWeekend) {
    if (t >= preOpen && t < regOpen) {
      kind = 'pre_market';
      label = 'Pre-market';
    } else if (t >= regOpen && t < regClose) {
      kind = 'regular';
      label = 'Market open';
    } else if (t >= regClose && t < ahClose) {
      kind = 'after_hours';
      label = 'After hours';
    } else {
      kind = 'closed';
      label = 'Market closed';
    }
  }

  return { kind, label, etTimeLabel, etDateLabel };
}
