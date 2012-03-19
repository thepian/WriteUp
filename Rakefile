task :default => :populate

desc 'Build Server Executables'
task :executables do
  sh 'mkdir -p _server'
  sh 'mkdir -p _server/lib-python'
  sh 'mkdir -p _server/lib_pypy'
  sh 'mkdir -p _server/site-packages'
  sh 'rsync -rtzh ~/repositories/MeshedBuilder/lib-python/ ./_server/lib-python/'
  sh 'rsync -rtzh ~/repositories/MeshedBuilder/lib_pypy/ ./_server/lib_pypy/'
  sh 'rsync -rtzh ~/repositories/MeshedBuilder/site-packages/ ./_server/site-packages/'
  sh 'rsync -rtzh ~/repositories/MeshedBuilder/$OSTYPE/ ./_server'
  sh 'cp -f ~/repositories/MeshedBuilder/Meshed-512x512.png ./_server'
  sh 'cp -f ~/repositories/MeshedBuilder/Meshed.icns ./_server'
  sh '_server/Meshed ~/repositories/MeshedBuilder/distribute_setup.py'
  sh '_server/Meshed ~/repositories/MeshedBuilder/get-pip.py'
end

desc 'Install Server Dependencies'
task :dependencies do
  sh '_server/bin/pip install BeautifulSoup'
  sh '_server/bin/pip install markdown2'
  sh '_server/bin/pip install pyScss'
  sh '_server/bin/pip install git+git://github.com/ingydotnet/pyyaml-mirror.git#egg=PyYAML'
  sh '_server/bin/pip install redis'
  sh '_server/bin/pip install git+git://github.com/thepian/thepian-lib.git#egg=thepian-lib'
  sh '_server/bin/pip install git+git://github.com/facebook/tornado'
  sh '_server/bin/pip install git+git://github.com/thepian/thepian-pages.git#egg=thepian-pages'
  sh '_server/bin/pip install git+git://github.com/thepian/python-daemon.git#egg=python-daemon'
  sh '_server/bin/pip install http://www.blarg.net/%7Esteveha/pyfeed-0.7.4.tar.gz#egg=pyfeed'
  sh '_server/bin/pip install hg+http://bitbucket.org/thepian/pymeta#egg=pymeta2'
end

desc 'Fresh thepian dependencies'
task :fresh do
  sh '_server/bin/pip install hg+http://bitbucket.org/thepian/pymeta#egg=pymeta2'
  sh '_server/bin/pip install --upgrade git+git://github.com/thepian/thepian-lib.git'
  sh '_server/bin/pip install --upgrade git+git://github.com/thepian/thepian-pages.git'
end

desc 'Build and start production server'
task :server do
  sh '_server/bin/runserver'
end

desc 'Build and start dev server'
task :devserver do
  sh '_server/bin/runserver --debug'
end

desc 'Populate server pages'
task :populateserver do
  sh '_server/bin/populateserver --debug'
end

desc 'Update cache'
task :populate do
  sh '_server/Meshed -c "import specserver;specserver.populate()"'
end

desc 'Make a self-signed SSL certificate'
task :devcertificate do
  sh 'sudo ssh-keygen -f devcertificate.key'
  sh 'sudo openssl req -new -key devcertificate.key -out devcertificate.csr'
  sh 'sudo openssl x509 -req -days 365 -in devcertificate.csr -signkey devcertificate.key -out devcertificate.crt'
end

