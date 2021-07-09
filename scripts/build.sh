#!/bin/sh

echo "Removing content symlink"
rm ./public/content
react-scripts build

echo "Adding build/content symlink..."
ln -s ../content ./build/

echo "Restoring public/content symlink.."
ln -s ../content ./public/
