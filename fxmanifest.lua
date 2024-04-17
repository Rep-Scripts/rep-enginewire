fx_version "cerulean"
description "Rep Engine Wire"
author "Q4D + Nkondr"
version '1.0.0'
lua54 'yes'
games {"gta5", "rdr3"}

ui_page 'web/build/index.html'

client_scripts { "client.lua"}

files {'web/build/index.html', 'web/build/**/*', 'locales/*.json'}
