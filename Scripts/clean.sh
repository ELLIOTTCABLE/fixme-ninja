#!/usr/bin/env sh

rm -rf ./Tests/Work/
mv node_modules{,-PRECLEAN}/
git clean -Xdf
mv node_modules{-PRECLEAN,}/
