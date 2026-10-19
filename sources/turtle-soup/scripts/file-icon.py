# 海龟汤的牌局文件图标（manifest 的 fileIcons）：照办公 pptx.png 的样子，渐变方块里一个白色图形。重画：python3 -I scripts/file-icon.py，输出到当前目录。
from PIL import Image, ImageDraw
S = 1024
top, bottom = (183, 165, 236), (123, 91, 214)          # the App icon's lilac and violet
img = Image.new('RGBA', (S, S))
grad = Image.new('RGBA', (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    t = y / (S - 1)
    gd.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
mask = Image.new('L', (S, S))
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=200, fill=255)
img.paste(grad, (0, 0), mask)
d = ImageDraw.Draw(img)
W, V = (255, 255, 255, 255), (123, 91, 214, 255)
# turtle in the soup: shell dome with three plates, head and an eye, a front flipper
d.pieslice([300, 250, 660, 610], 180, 360, fill=W)
for box in ([360, 330, 450, 400], [455, 300, 545, 370], [550, 330, 630, 400]):
    d.rounded_rectangle(box, radius=20, fill=V)
d.ellipse([640, 330, 770, 450], fill=W)
d.ellipse([700, 365, 732, 397], fill=V)
d.ellipse([600, 400, 690, 470], fill=W)
# a violet gap, then the bowl: rim band, body, foot
d.rectangle([170, 455, 854, 470], fill=V)
d.rounded_rectangle([160, 470, 864, 540], radius=35, fill=W)
d.rectangle([160, 540, 864, 562], fill=V)
d.chord([200, 260, 824, 860], 0, 180, fill=W)
d.rounded_rectangle([390, 845, 634, 890], radius=12, fill=W)
img.resize((256, 256), Image.LANCZOS).save('turtle-soup-file.png')
