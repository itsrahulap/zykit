// Curated .gitignore templates, written for this tool from common practice. Each body is plain
// gitignore text; `merge` in gitignore-generator.ts joins and dedupes them.

export type Group = 'Languages' | 'Frameworks' | 'Editors & IDEs' | 'Operating systems' | 'Tools & misc';

export interface Template {
  id: string;
  name: string;
  group: Group;
  body: string;
}

const t = (id: string, name: string, group: Group, body: string): Template => ({ id, name, group, body: body.trim() });

export const TEMPLATES: Template[] = [
  // ---- Languages ----
  t('node', 'Node.js', 'Languages', `
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.pnpm-store/
.npm
.yarn/cache
.yarn/install-state.gz
*.tsbuildinfo
.eslintcache
coverage/
.nyc_output/
dist/
build/
*.tgz`),
  t('typescript', 'TypeScript', 'Languages', `
*.tsbuildinfo
dist/
out-tsc/
*.js.map
*.d.ts.map`),
  t('python', 'Python', 'Languages', `
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
dist/
develop-eggs/
eggs/
.eggs/
*.egg-info/
*.egg
wheels/
.venv/
venv/
env/
ENV/
.pytest_cache/
.mypy_cache/
.ruff_cache/
.tox/
.nox/
.coverage
.coverage.*
htmlcov/
.ipynb_checkpoints/
pip-log.txt`),
  t('java', 'Java', 'Languages', `
*.class
*.jar
*.war
*.ear
*.log
hs_err_pid*
replay_pid*
target/`),
  t('gradle', 'Gradle', 'Languages', `
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
!**/src/main/**/build/
!**/src/test/**/build/
local.properties`),
  t('maven', 'Maven', 'Languages', `
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties
.mvn/wrapper/maven-wrapper.jar`),
  t('kotlin', 'Kotlin', 'Languages', `
*.class
*.kotlin_module
.kotlin/
build/
out/`),
  t('scala', 'Scala / sbt', 'Languages', `
*.class
*.log
target/
project/target/
project/project/
.bsp/
.metals/
.bloop/
.idea/`),
  t('go', 'Go', 'Languages', `
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
vendor/
go.work
go.work.sum
bin/
coverage.txt
coverage.html`),
  t('rust', 'Rust', 'Languages', `
target/
**/*.rs.bk
*.pdb
# Cargo.lock belongs in git for applications; uncomment for libraries
# Cargo.lock`),
  t('dotnet', '.NET / C#', 'Languages', `
bin/
obj/
[Dd]ebug/
[Rr]elease/
x64/
x86/
*.user
*.suo
*.userosscache
*.sln.docstates
.vs/
*.nupkg
*.snupkg
packages/
TestResults/
*.log
project.lock.json
.nuget/`),
  t('ruby', 'Ruby', 'Languages', `
*.gem
*.rbc
.bundle/
vendor/bundle/
.byebug_history
.rspec_status
coverage/
doc/
.yardoc/
_yardoc/
tmp/
log/
.ruby-version`),
  t('php', 'PHP', 'Languages', `
.phpunit.result.cache
.phpunit.cache/
.php-cs-fixer.cache
.phpcs-cache
*.phar
phpunit.xml
phpstan.neon`),
  t('composer', 'PHP Composer', 'Languages', `
vendor/
composer.phar
auth.json
.composer/`),
  t('swift', 'Swift / Xcode', 'Languages', `
xcuserdata/
*.xcuserstate
*.xccheckout
*.xcscmblueprint
DerivedData/
build/
*.hmap
*.ipa
*.dSYM.zip
*.dSYM
.build/
.swiftpm/
Packages/
Pods/
Carthage/Build/
*.moved-aside
timeline.xctimeline
playground.xcworkspace`),
  t('objective-c', 'Objective-C', 'Languages', `
build/
DerivedData/
xcuserdata/
*.xcuserstate
*.o
*.a
*.dSYM/
Pods/`),
  t('android', 'Android', 'Languages', `
*.apk
*.aab
*.ap_
*.dex
bin/
gen/
out/
.gradle/
build/
local.properties
captures/
.externalNativeBuild/
.cxx/
*.iml
.idea/
proguard/
*.keystore
!debug.keystore
google-services.json`),
  t('flutter', 'Flutter / Dart', 'Languages', `
.dart_tool/
.packages
.pub-cache/
.pub/
build/
.flutter-plugins
.flutter-plugins-dependencies
.fvm/
*.g.dart
*.freezed.dart
pubspec.lock
ios/Pods/
ios/.symlinks/
android/.gradle/
android/local.properties
coverage/`),
  t('c-cpp', 'C / C++', 'Languages', `
*.o
*.obj
*.a
*.lib
*.so
*.dylib
*.dll
*.exe
*.out
*.d
*.gch
*.pch
*.slo
*.lo
*.la
*.lai
*.su
*.idb
*.pdb
build/
bin/`),
  t('cmake', 'CMake', 'Languages', `
CMakeCache.txt
CMakeFiles/
CMakeScripts/
cmake_install.cmake
install_manifest.txt
compile_commands.json
CTestTestfile.cmake
_deps/
build/
cmake-build-*/
Testing/`),
  t('elixir', 'Elixir', 'Languages', `
_build/
deps/
cover/
doc/
*.ez
erl_crash.dump
.fetch
.elixir_ls/`),
  t('haskell', 'Haskell', 'Languages', `
dist/
dist-newstyle/
.stack-work/
.cabal-sandbox/
cabal.sandbox.config
*.hi
*.o
*.dyn_hi
*.dyn_o
.ghc.environment.*`),
  t('r', 'R', 'Languages', `
.Rhistory
.Rapp.history
.RData
.Ruserdata
.Rproj.user/
*.Rcheck/
*.tar.gz
renv/library/
renv/staging/
.httr-oauth`),
  t('julia', 'Julia', 'Languages', `
*.jl.cov
*.jl.*.cov
*.jl.mem
Manifest.toml
.vscode/
docs/build/
deps/build.log`),
  t('lua', 'Lua', 'Languages', `
luac.out
*.luac
*.src.rock
*.zip
*.tar.gz
*.o
*.os
*.ko
*.so
*.dll
lua_modules/
.luarocks/`),
  t('perl', 'Perl', 'Languages', `
blib/
Build
Build.bat
_build/
cover_db/
inc/
Makefile
Makefile.old
MYMETA.*
pm_to_blib
*.o
*.bs
*.tmp
local/`),
  // ---- Frameworks ----
  t('nextjs', 'Next.js', 'Frameworks', `
.next/
out/
next-env.d.ts
.vercel
node_modules/
*.tsbuildinfo
.env*.local`),
  t('nuxt', 'Nuxt', 'Frameworks', `
.nuxt/
.output/
.nitro/
.cache/
dist/
node_modules/`),
  t('vite', 'Vite', 'Frameworks', `
node_modules/
dist/
dist-ssr/
*.local
.vite/
vite.config.js.timestamp-*
vite.config.ts.timestamp-*`),
  t('react', 'React / CRA', 'Frameworks', `
node_modules/
build/
coverage/
.eslintcache
npm-debug.log*
yarn-debug.log*
yarn-error.log*`),
  t('angular', 'Angular', 'Frameworks', `
dist/
tmp/
out-tsc/
.angular/
.sass-cache/
node_modules/
/connect.lock
/coverage
/libpeerconnection.log
testem.log
/typings
.nx/`),
  t('vue', 'Vue', 'Frameworks', `
node_modules/
dist/
.vite/
*.local
coverage/
.nuxt/`),
  t('svelte', 'SvelteKit', 'Frameworks', `
.svelte-kit/
build/
node_modules/
.vercel
.netlify
vite.config.js.timestamp-*
vite.config.ts.timestamp-*`),
  t('astro', 'Astro', 'Frameworks', `
dist/
.astro/
node_modules/
.env
.env.production`),
  t('gatsby', 'Gatsby', 'Frameworks', `
.cache/
public/
node_modules/
.env.development
.env.production`),
  t('django', 'Django', 'Frameworks', `
*.log
*.pot
*.pyc
__pycache__/
local_settings.py
db.sqlite3
db.sqlite3-journal
media/
staticfiles/
/static_root/`),
  t('flask', 'Flask', 'Frameworks', `
instance/
.webassets-cache
*.db
*.sqlite3`),
  t('laravel', 'Laravel', 'Frameworks', `
/vendor/
/node_modules/
/public/build
/public/hot
/public/storage
/storage/*.key
/storage/pail
.env
.env.backup
.env.production
.phpunit.result.cache
Homestead.json
Homestead.yaml
auth.json
npm-debug.log
yarn-error.log`),
  t('symfony', 'Symfony', 'Frameworks', `
/.env.local
/.env.local.php
/.env.*.local
/config/secrets/prod/prod.decrypt.private.php
/public/bundles/
/var/
/vendor/
.phpunit.result.cache`),
  t('rails', 'Ruby on Rails', 'Frameworks', `
/log/*
/tmp/*
!/log/.keep
!/tmp/.keep
/storage/*
!/storage/.keep
/public/assets
/public/packs
/public/packs-test
/node_modules
/yarn-error.log
.byebug_history
/config/master.key
/config/credentials/*.key
.env*
!.env.example
*.sqlite3
*.sqlite3-*`),
  t('spring', 'Spring Boot', 'Frameworks', `
target/
build/
!gradle/wrapper/gradle-wrapper.jar
application-local.properties
application-local.yml
HELP.md
.springBeans
.sts4-cache/`),
  t('dotnet-core', 'ASP.NET Core', 'Frameworks', `
bin/
obj/
.vs/
*.user
appsettings.Development.json
appsettings.Local.json
launchSettings.json
wwwroot/lib/
App_Data/`),
  t('unity', 'Unity', 'Frameworks', `
/[Ll]ibrary/
/[Tt]emp/
/[Oo]bj/
/[Bb]uild/
/[Bb]uilds/
/[Ll]ogs/
/[Uu]ser[Ss]ettings/
/[Mm]emoryCaptures/
/[Rr]ecordings/
*.csproj
*.unityproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db
sysinfo.txt
*.apk
*.aab
*.unitypackage
crashlytics-build.properties
/[Aa]ssets/AssetStoreTools*
/[Aa]ssets/Plugins/Editor/JetBrains*
.vsconfig`),
  t('unreal', 'Unreal Engine', 'Frameworks', `
Binaries/
DerivedDataCache/
Intermediate/
Saved/
Build/
.vs/
*.VC.db
*.opensdf
*.opendb
*.sdf
*.sln
*.suo
*.xcodeproj
*.xcworkspace
Plugins/*/Binaries/
Plugins/*/Intermediate/`),
  t('godot', 'Godot', 'Frameworks', `
.godot/
.import/
export.cfg
export_presets.cfg
*.translation
mono_crash.*.json
.mono/
data_*/`),
  t('electron', 'Electron', 'Frameworks', `
node_modules/
out/
dist/
release/
.webpack/
*.log
.DS_Store`),
  t('wordpress', 'WordPress', 'Frameworks', `
wp-config.php
wp-content/uploads/
wp-content/cache/
wp-content/upgrade/
wp-content/backup-db/
wp-content/advanced-cache.php
wp-content/wp-cache-config.php
wp-content/blogs.dir/
sitemap.xml
sitemap.xml.gz
*.log`),
  // ---- Editors & IDEs ----
  t('vscode', 'Visual Studio Code', 'Editors & IDEs', `
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/*.code-snippets
.history/
*.vsix`),
  t('jetbrains', 'JetBrains IDEs', 'Editors & IDEs', `
.idea/
*.iml
*.iws
*.ipr
out/
cmake-build-*/
.idea_modules/
atlassian-ide-plugin.xml`),
  t('vim', 'Vim', 'Editors & IDEs', `
[._]*.s[a-v][a-z]
[._]*.sw[a-p]
[._]s[a-rt-v][a-z]
[._]ss[a-gi-z]
[._]sw[a-p]
Session.vim
Sessionx.vim
.netrwhist
*~
tags
[._]*.un~`),
  t('emacs', 'Emacs', 'Editors & IDEs', `
*~
\\#*\\#
/.emacs.desktop
/.emacs.desktop.lock
*.elc
auto-save-list
tramp
.\\#*
.org-id-locations
*_archive
flycheck_*.el
.projectile
.dir-locals.el
/elpa/`),
  t('sublime', 'Sublime Text', 'Editors & IDEs', `
*.sublime-workspace
*.sublime-project
sftp-config.json
sftp-config-alt*.json
Package Control.last-run
Package Control.ca-list
Package Control.ca-bundle
Package Control.system-ca-bundle
Package Control.cache/
Package Control.ca-certs/
bh_unicode_properties.cache
GitHub.sublime-settings`),
  t('eclipse', 'Eclipse', 'Editors & IDEs', `
.metadata/
bin/
tmp/
*.tmp
*.bak
*.swp
*~.nib
local.properties
.settings/
.loadpath
.recommenders
.classpath
.project
.factorypath
.apt_generated/`),
  t('visual-studio', 'Visual Studio', 'Editors & IDEs', `
.vs/
*.suo
*.user
*.userosscache
*.sln.docstates
*.rsuser
[Bb]in/
[Oo]bj/
[Dd]ebug/
[Rr]elease/
*.VC.db
*.VC.VC.opendb
ipch/
*.aps
*.ncb
*.opensdf
*.sdf
*.cachefile
_ReSharper*/
*.[Rr]e[Ss]harper
*.DotSettings.user
.ionide/`),
  t('xcode', 'Xcode', 'Editors & IDEs', `
xcuserdata/
*.xcuserstate
*.xcscmblueprint
*.xccheckout
DerivedData/
*.moved-aside
*.hmap
*.ipa
*.dSYM.zip
*.dSYM`),
  t('nova-zed', 'Zed / Nova', 'Editors & IDEs', `
.zed/
.nova/`),
  // ---- Operating systems ----
  t('macos', 'macOS', 'Operating systems', `
.DS_Store
.AppleDouble
.LSOverride
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk
Icon\\r`),
  t('windows', 'Windows', 'Operating systems', `
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
Desktop.ini
$RECYCLE.BIN/
*.stackdump
*.lnk
*.cab
*.msi
*.msix
*.msm
*.msp`),
  t('linux', 'Linux', 'Operating systems', `
*~
.fuse_hidden*
.directory
.Trash-*
.nfs*`),
  // ---- Tools & misc ----
  t('env', 'Env files & secrets', 'Tools & misc', `
.env
.env.*
!.env.example
!.env.sample
*.pem
*.key
*.p12
*.pfx
*.keystore
secrets.*
credentials.json
service-account*.json`),
  t('logs', 'Logs', 'Tools & misc', `
*.log
logs/
log/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
pnpm-debug.log*
*.log.*`),
  t('terraform', 'Terraform', 'Tools & misc', `
.terraform/
*.tfstate
*.tfstate.*
crash.log
crash.*.log
*.tfvars
*.tfvars.json
override.tf
override.tf.json
*_override.tf
*_override.tf.json
.terraformrc
terraform.rc
.terraform.tfstate.lock.info
!.terraform.lock.hcl`),
  t('docker', 'Docker', 'Tools & misc', `
docker-compose.override.yml
.docker/
*.pid
.dockerignore.local
docker-compose.local.yml`),
  t('kubernetes', 'Kubernetes / Helm', 'Tools & misc', `
*.kubeconfig
kubeconfig
.kube/
charts/*.tgz
Chart.lock
.helmignore.local
secrets.yaml
*-secret.yaml
skaffold.local.yaml`),
  t('ansible', 'Ansible', 'Tools & misc', `
*.retry
.vault_pass
.vault_pass.txt
vault_password*
ansible.log
.ansible/
inventory/*.local
group_vars/*vault*`),
  t('vagrant', 'Vagrant', 'Tools & misc', `
.vagrant/
*.box
vagrant-*.log`),
  t('jupyter', 'Jupyter Notebook', 'Tools & misc', `
.ipynb_checkpoints/
*/.ipynb_checkpoints/*
profile_default/
ipython_config.py
*.nbconvert.ipynb`),
  t('latex', 'LaTeX', 'Tools & misc', `
*.aux
*.log
*.out
*.toc
*.lof
*.lot
*.fls
*.fdb_latexmk
*.synctex.gz
*.bbl
*.blg
*.bcf
*.run.xml
*.nav
*.snm
*.vrb
*.dvi
*.xdv
_minted*/`),
  t('sass', 'Sass', 'Tools & misc', `
.sass-cache/
*.css.map
*.sass.map
*.scss.map`),
  t('tests-coverage', 'Test coverage & reports', 'Tools & misc', `
coverage/
.nyc_output/
htmlcov/
junit.xml
test-results/
playwright-report/
blob-report/
.coverage
*.lcov`),
  t('archives', 'Archives & binaries', 'Tools & misc', `
*.7z
*.dmg
*.gz
*.iso
*.jar
*.rar
*.tar
*.zip
*.bin
*.exe`),
  t('temp-backup', 'Temp & backup files', 'Tools & misc', `
*.tmp
*.temp
*.bak
*.swp
*.orig
*.rej
*~
.cache/
tmp/
temp/`),
  t('database', 'Local databases', 'Tools & misc', `
*.sqlite
*.sqlite3
*.db
*.db-journal
*.mdb
*.rdb
dump.rdb`),
  t('serverless', 'Serverless Framework', 'Tools & misc', `
.serverless/
.webpack/
.esbuild/
.dynamodb/
.build/
node_modules/`),
  t('bazel', 'Bazel', 'Tools & misc', `
bazel-*
.bazelrc.user
MODULE.bazel.lock`),
];

export const GROUPS: Group[] = ['Languages', 'Frameworks', 'Editors & IDEs', 'Operating systems', 'Tools & misc'];
