#!/bin/sh



echo "Removing content symlink"
rm ./public/content


echo "Updating Manifest version"
VERSION=`jq -r '.version' ./package.json`
jq --arg version $VERSION '.version=$version' ./public/manifest.json > ./public/manifest2.json
rm ./public/manifest.json;
mv ./public/manifest2.json ./public/manifest.json

react-scripts build

echo "Adding build/content symlink..."
ln -s ../content ./build/

echo "Restoring public/content symlink.."
ln -s ../content ./public/


