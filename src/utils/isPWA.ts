export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
}

export function hasVisitedBefore(): boolean {
  return localStorage.getItem('visited') === 'true';
}

export function markAsVisited(): void {
  localStorage.setItem('visited', 'true');
}