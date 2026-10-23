"""Validate the install overlay without contacting an account or game API."""
from pathlib import Path
from zipfile import ZipFile
import re

root=Path(__file__).resolve().parent
active={
 'modules/poker/runtime/poker-core-v326.js':root/'public/modules/poker/runtime/poker-core-v326.js',
 'assets/js-v326/cas-bootstrap.js':root/'public/assets/js-v326/cas-bootstrap.js',
 'assets/js-v326/casino.js':root/'public/assets/js-v326/casino.js',
 'modules/poker/runtime/poker-pro-v326.js':root/'public/modules/poker/runtime/poker-pro-v326.js',
 'modules/network/runtime/online-v326.js':root/'public/modules/network/runtime/online-v326.js',
 'modules/legacy/runtime/wallet-v326.js':root/'public/modules/legacy/runtime/wallet-v326.js',
 'modules/ui/runtime/roulette-photo-v326.js':root/'runtime/roulette-photo.js',
 'modules/ui/styles/gameplay-v326.css':root/'runtime/gameplay-ui.css',
}
with ZipFile(root/'deploy/cas-ecosystem.zip') as archive:
    names=[i.filename for i in archive.infolist() if not i.is_dir()]
    assert len(names)==len(set(names))==32, 'Unexpected or duplicate public files'
    assert archive.testzip() is None, 'Corrupt archive entry'
    for name in names:
        assert not name.startswith(('/', '\\')) and '..' not in name.split('/'), name
        assert Path(name).suffix in {'.js','.css','.html','.webp'}, name
        assert not any(part in name.lower() for part in ('private','secret','.env','worker.owner','test/','fixture')),name
    index=archive.read('index.html').decode('utf-8')
    worker=archive.read('service-worker.js').decode('utf-8')
    assert 'full-audit-20261023-v326-shell' in worker
    scripts=re.findall(r'<script\b[^>]*src="([^"]+)"',index)
    assert len(scripts)==len(set(scripts)), 'Duplicate script load'
    for name,source in active.items():
        assert archive.read(name)==source.read_bytes(), f'Package/source mismatch: {name}'
        assert name in index and name in worker, f'Inactive or uncached release asset: {name}'
    assert 'modules/legacy/legacy-runtime/04-v69-jarvis-cas-runtime.js' not in index
    assert archive.read('index.html')==(root/'public/index.html').read_bytes()
    assert archive.read('service-worker.js')==(root/'public/service-worker.js').read_bytes()
print('Verified 32 public files, active v326 assets, script uniqueness, source bytes and rollback-safe cache paths.')
