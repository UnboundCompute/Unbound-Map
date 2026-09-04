const origin = (process.env.DESIGN_MAP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

async function page(path, expected) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.text();
  for (const marker of expected) {
    if (!body.includes(marker)) throw new Error(`${path} is missing ${JSON.stringify(marker)}`);
  }
  const h1Count = (body.match(/<h1\b/g) ?? []).length;
  if (h1Count !== 1) throw new Error(`${path} rendered ${h1Count} h1 elements; expected exactly one`);
  if (!body.includes('<main')) throw new Error(`${path} is missing its main landmark`);
  console.log(`ok ${path}`);
}

async function redirect(path, target) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  if (![301, 302, 307, 308].includes(response.status)) throw new Error(`${path} returned HTTP ${response.status}, expected redirect`);
  if (!response.headers.get('location')?.includes(target)) throw new Error(`${path} does not redirect to ${target}`);
  console.log(`ok ${path} → ${response.headers.get('location')}`);
}

await page('/?repository=Zeek&revision=main&bundle=b_demo123', ['Zeek: see the system before you read it']);
await page('/architecture?repository=Zeek&revision=main&region=decode&level=2&anchor=DecodeEthernet%28%29', ['Design anchors', 'DecodeEthernet()', 'aria-current="true"', '<meta property="og:title" content="Zeek architecture · Design Map"', '<meta name="twitter:title" content="Zeek architecture · Design Map"']);
await page('/flows?repository=Zeek&revision=main&step=ipv4', ['validated IPv4 payload', 'step=ipv4', '<meta property="og:title" content="Zeek architectural flows · Design Map"', '<meta name="twitter:title" content="Zeek architectural flows · Design Map"']);
await page('/trust?repository=Zeek&revision=main&q=memory&kind=input', ['value="memory"', 'value="input"', 'Memory safety', '<meta property="og:title" content="Zeek trust surfaces · Design Map"', '<meta name="twitter:title" content="Zeek trust surfaces · Design Map"']);
await page('/explore?repository=Zeek&revision=main&region=decode&anchor=DecodeIPV4%28%29&bundle=b_demo123', ['Context ready', 'DecodeIPV4()', 'b_demo123']);
await page('/embed?repository=Zeek&revision=main&bundle=b_demo123', ['Zeek architecture', 'Graph-backed bundle requested', 'Preparing the architecture map', 'Skip to map', 'id="embed-content"']);
await page('/architecture?region=unknown&level=1', ['requested region is not present']);
await page('/architecture?region=decode&level=2&anchor=MissingAnchor%28%29', ['requested anchor is not present']);
await redirect('/map?region=decode&level=1', '/architecture?region=decode&level=1');
await redirect('/flow?step=ipv4', '/flows?step=ipv4');
