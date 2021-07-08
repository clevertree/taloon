#!/bin/sh


if [ -d "./public/content" ]
then
    echo "Symlink already exists: public/content"
else
    echo "Adding public/content symlink..."
    ln -s ../content ./public/
fi