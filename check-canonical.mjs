fetch('https://www.retiru.com/es/condiciones')
  .then(r => r.text())
  .then(t => {
    const match = t.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
    console.log("Canonical:", match ? match[1] : "Not found");
  });
