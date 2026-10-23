from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import stat
root = Path(__file__).resolve().parent
files = {'index.html': root/'public/index.html', 'service-worker.js': root/'public/service-worker.js', 'modules/ui/styles/ecosystem-v322.css': root/'runtime/ecosystem-ui.css', 'modules/ui/runtime/ecosystem-v323.js': root/'runtime/ecosystem-ui.js'}
files['modules/ui/styles/gameplay-v326.css'] = root/'runtime/gameplay-ui.css'
files['modules/ui/runtime/gameplay-v323.js'] = root/'runtime/gameplay-ui.js'
files['modules/ui/runtime/account-v324.js'] = root/'runtime/account-ui.js'
files['assets/art/roulette-studio-v322.webp'] = root/'public/assets/art/roulette-studio-v322.webp'
for public_name, source_name in (('blackjack-photo','blackjack-photo'),('lobby-v325','lobby-ui'),('roulette-picker-v323','roulette-picker')):
    files['modules/ui/styles/'+public_name+'.css' if public_name.endswith(('v323','v325')) else 'modules/ui/styles/'+public_name+'-v323.css'] = root/'runtime'/(source_name+'.css')
for public_name, source_name in (('roulette-photo-v326','roulette-photo'),('roulette-picker-v324','roulette-picker'),('lobby-v325','lobby-ui')):
    files['modules/ui/runtime/'+public_name+('' if public_name.endswith(('v324','v325','v326')) else '-v323')+'.js'] = root/'runtime'/(source_name+'.js')
for name in ('blackjack-reference','profile','leaderboard','updates','tutorial','poker','roulette-no-ball'):
    files['assets/art/'+name+'-v323.webp'] = root/'public/assets/art'/(name+'-v323.webp')
files['modules/legacy/runtime/wallet-v326.js'] = root/'public/modules/legacy/runtime/wallet-v326.js'
files['modules/poker/runtime/poker-core-v326.js'] = root/'public/modules/poker/runtime/poker-core-v326.js'
files['modules/poker/runtime/poker-pro-v326.js'] = root/'public/modules/poker/runtime/poker-pro-v326.js'
for name in ('assets/js-v326/cas-bootstrap.js', 'assets/js-v326/casino.js', 'modules/profile/runtime/progression-v322.js', 'modules/ui/runtime/experience-v322.js', 'modules/ui/runtime/pwa-v322.js'):
    files[name] = root/'public'/name
for name in ('modules/poker/runtime/poker-stability-v325.js', 'modules/core/runtime/lifecycle-v325.js', 'modules/network/runtime/online-v326.js'):
    files[name] = root/'public'/name
(root/'deploy').mkdir(exist_ok=True)
with ZipFile(root/'deploy/cas-ecosystem.zip','w',compression=ZIP_DEFLATED) as out:
    dirs = {str(parent).replace('\\','/')+'/' for name in files for parent in Path(name).parents if str(parent) != '.'}
    for name in sorted(dirs) + sorted(files):
        isdir = name.endswith('/')
        info = ZipInfo(name,(2026,10,23,0,0,0))
        info.create_system = 3
        info.compress_type = ZIP_DEFLATED
        info.external_attr = ((stat.S_IFDIR|0o755) if isdir else (stat.S_IFREG|0o644)) << 16
        if isdir: info.external_attr |= 0x10
        out.writestr(info,b'' if isdir else files[name].read_bytes())
print(f'Prepared CAS reliability release: {len(files)} public files')
