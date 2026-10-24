"""Validate the install overlay without contacting an account or game API."""
from pathlib import Path
from zipfile import ZipFile
import re

root=Path(__file__).resolve().parent
active={
 'assets/js-v327/identity-account.js':root/'public/assets/js-v327/identity-account.js',
 'modules/poker/runtime/poker-core-v326.js':root/'public/modules/poker/runtime/poker-core-v326.js',
 'assets/js-v326/cas-bootstrap.js':root/'public/assets/js-v326/cas-bootstrap.js',
 'assets/js-v327/casino.js':root/'public/assets/js-v327/casino.js',
 'modules/poker/runtime/poker-pro-v326.js':root/'public/modules/poker/runtime/poker-pro-v326.js',
 'modules/network/runtime/online-v327.js':root/'public/modules/network/runtime/online-v327.js',
 'modules/legacy/runtime/wallet-v327.js':root/'public/modules/legacy/runtime/wallet-v327.js',
 'modules/ui/runtime/roulette-photo-v326.js':root/'runtime/roulette-photo.js',
 'modules/ui/runtime/account-v327.js':root/'runtime/account-ui.js',
 'modules/ui/styles/gameplay-v327.css':root/'runtime/gameplay-ui.css',
}
with ZipFile(root/'deploy/cas-ecosystem.zip') as archive:
    names=[i.filename for i in archive.infolist() if not i.is_dir()]
    assert len(names)==len(set(names))==33, 'Unexpected or duplicate public files'
    assert archive.testzip() is None, 'Corrupt archive entry'
    for name in names:
        assert not name.startswith(('/', '\\')) and '..' not in name.split('/'), name
        assert Path(name).suffix in {'.js','.css','.html','.webp'}, name
        assert not any(part in name.lower() for part in ('private','secret','.env','worker.owner','test/','fixture')),name
    index=archive.read('index.html').decode('utf-8')
    worker=archive.read('service-worker.js').decode('utf-8')
    assert 'recovery-20261024-v327-shell' in worker
    scripts=re.findall(r'<script\b[^>]*src="([^"]+)"',index)
    assert len(scripts)==len(set(scripts)), 'Duplicate script load'
    for name,source in active.items():
        assert archive.read(name)==source.read_bytes(), f'Package/source mismatch: {name}'
        assert name in index and name in worker, f'Inactive or uncached release asset: {name}'
    assert 'modules/legacy/legacy-runtime/04-v69-jarvis-cas-runtime.js' not in index
    assert archive.read('index.html')==(root/'public/index.html').read_bytes()
    assert archive.read('service-worker.js')==(root/'public/service-worker.js').read_bytes()
print('Verified 33 public files, active release assets, script uniqueness, source bytes and rollback-safe cache paths.')
