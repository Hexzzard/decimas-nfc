export function textoDecimas(n: number): string {
  return `${n} ${n === 1 ? 'décima' : 'décimas'}`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter((parte) => parte.length > 0)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

const PALETA_AVATAR = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#BBF7D0', '#DDD6FE', '#FED7AA'];

/** Siempre el mismo color para el mismo estudiante. */
export function colorAvatar(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return PALETA_AVATAR[h % PALETA_AVATAR.length] ?? '#E5E7EB';
}

/** "27/10 · 10:05" en la hora local del teléfono. */
export function formatearFecha(iso: string): string {
  const d = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)} · ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
