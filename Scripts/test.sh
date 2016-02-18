#!/usr/bin/env sh
                                                                              set +o verbose
# Usage:
# ------
# FIXME: Document this testing script.
#
# Mostly copied from Paws.js:
#    <https://github.com/ELLIOTTCABLE/Paws.js/blob/6f77f3e1/Scripts/test.sh>

puts() { printf %s\\n "$@" ;}
pute() { printf %s\\n "~~ $*" >&2 ;}
argq() { [ $# -gt 0 ] && printf "'%s' " "$@" ;}

unit_dir="$npm_package_config_dirs_tests"
products_dir="$npm_package_config_dirs_products"

# FIXME: This should support *excluded* modules with a minus, as per `node-debug`:
#        https://github.com/visionmedia/debug
if echo "$DEBUG" | grep -qE '(^|,\s*)(\*|fixme.ninja(:(lib(:(scripts|\*))?|\*))?)($|,)'; then
   pute "Script debugging enabled (in: `basename $0`)."
   DEBUG_SCRIPTS=yes
   VERBOSE="${VERBOSE:-7}"
fi

[ -z "${SILENT##[NFnf]*}${QUIET##[NFnf]*}" ] && [ "${VERBOSE:-4}" -gt 6 ] && print_commands=yes

go () { [ -n "$print_commands" ] && puts '`` '"$*" >&2 ; "$@" || exit $? ;}

go mocha --compilers js:babel-register                                \
   --reporter "$mocha_reporter" --ui "$mocha_ui"                              \
   "$unit_dir"/*.tests.js "$@"
