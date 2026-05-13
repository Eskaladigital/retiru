param([string]$BaseUrl = 'http://localhost:3000')

$urls = @(
  '/es',
  '/es/sitemap',
  '/es/retiros-yoga',
  '/es/retiros-meditacion',
  '/es/retiros-mindfulness',
  '/es/retiros-detox',
  '/es/retiros-bienestar',
  '/es/retiros-espirituales',
  '/es/retiros-mujeres',
  '/es/retiros-naturaleza',
  '/es/retiros-yoga/andalucia',
  '/es/retiros-yoga/cataluna',
  '/es/retiros-yoga/galicia',
  '/es/retiros-meditacion/andalucia',
  '/es/retiros-mindfulness/cataluna',
  '/es/retiros-retiru',
  '/es/retiros-retiru/murcia',
  '/es/retiros-retiru/cabo-de-gata',
  '/es/retiros-en/espana',
  '/es/retiros-en/andalucia',
  '/en/retreats-yoga',
  '/en/retreats-meditation',
  '/en/retreats-yoga/andalusia',
  '/en/retreats-retiru',
  '/en/retreats-retiru/murcia',
  '/en/retreats-in/spain'
)

foreach ($u in $urls) {
  $full = "$BaseUrl$u"
  $code = & curl.exe -s -o NUL -w "%{http_code}" --max-time 30 $full
  Write-Host ('{0,3}  {1}' -f $code, $u)
}
