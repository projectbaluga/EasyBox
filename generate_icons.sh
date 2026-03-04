#!/bin/bash
rsvg-convert -w 48 -h 48 easybox_logo.svg -o android/app/src/main/res/mipmap-mdpi/ic_launcher.png
rsvg-convert -w 48 -h 48 easybox_logo.svg -o android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png

rsvg-convert -w 72 -h 72 easybox_logo.svg -o android/app/src/main/res/mipmap-hdpi/ic_launcher.png
rsvg-convert -w 72 -h 72 easybox_logo.svg -o android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png

rsvg-convert -w 96 -h 96 easybox_logo.svg -o android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
rsvg-convert -w 96 -h 96 easybox_logo.svg -o android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png

rsvg-convert -w 144 -h 144 easybox_logo.svg -o android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
rsvg-convert -w 144 -h 144 easybox_logo.svg -o android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png

rsvg-convert -w 192 -h 192 easybox_logo.svg -o android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
rsvg-convert -w 192 -h 192 easybox_logo.svg -o android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# For foreground adaptive icons, it's 108x108
rsvg-convert -w 108 -h 108 easybox_logo.svg -o android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
rsvg-convert -w 108 -h 108 easybox_logo.svg -o android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
rsvg-convert -w 108 -h 108 easybox_logo.svg -o android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
rsvg-convert -w 108 -h 108 easybox_logo.svg -o android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
rsvg-convert -w 108 -h 108 easybox_logo.svg -o android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png

echo "Icons generated successfully!"
