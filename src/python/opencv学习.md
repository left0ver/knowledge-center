# 解决 mac 中在 jupyter 中使用 opencv 关闭不了图像的问题

```python
  cv2.imshow("image", img)
  cv2.waitKey(0)
  cv2.destroyAllWindows()
  # 在摧毁窗口之后加上这样一行代码即可
  cv2.waitKey(1)
```



# 读取视频

```python

open = False
frame = None
videocapture = cv2.VideoCapture("data/02_Video/00_Scenery.mp4")
if videocapture.isOpened():
  open, frame = videocapture.read()
else:
  open = False
  
while open:
  ret, frame = videocapture.read()
  if frame is None:
    break
  else:
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    cv2.imshow("image", img)
    if cv2.waitKey(10) & 0xFF == ord("q"):
      break

videocapture.release()
cv2.destroyAllWindows()
cv2.waitKey(1)
```



# 图像处理

## ROI（range of interest）

ROI 就是截取自己想要的部分，可以通过切片完成

```python
cat_img = cv2.imread("data/01_Picture/01_cat.jpg")
print(cat_img.shape)
imageShow(cat_img)

# 截取一部分图像
ROI_cat_img = cat_img[150:350, 150:400]
imageShow(ROI_cat_img)
```



## 边界填充

opencv 中有很多种边界填充的方法

<img src="https://img.leftover.cn/img-md/202411042100409.png" alt="image-20241104210030292" style="zoom:50%;" />

```python
top_size, bottom_size, left_size, right_size = (50, 50, 50, 50)

imageShow(cat_img)
img_replicate = cv2.copyMakeBorder(cat_img, top_size, bottom_size, left_size, right_size,
                                   borderType=cv2.BORDER_REPLICATE)
imageShow(img_replicate)

img_reflect = cv2.copyMakeBorder(cat_img, top_size, bottom_size, left_size, right_size,
                                 borderType=cv2.BORDER_REFLECT)
imageShow(img_reflect)

img_reflect101 = cv2.copyMakeBorder(cat_img, top_size, bottom_size, left_size, right_size,
                                    borderType=cv2.BORDER_REFLECT101)
imageShow(img_reflect101)

img_wrap = cv2.copyMakeBorder(cat_img, top_size, bottom_size, left_size, right_size,
                              borderType=cv2.BORDER_WRAP)
imageShow(img_wrap)

# 常量填充
img_constant = cv2.copyMakeBorder(cat_img, top_size, bottom_size, left_size, right_size,
                                  borderType=cv2.BORDER_CONSTANT, value=[0, 0, 0])
imageShow(img_constant)
```



## 数值计算

可以直接相加 ，也可以使用 add 函数相加（超过 255 则会变为 255）

```python
print(cat_img[:5, :5, 1])
cat_img1 = cat_img[:5, :5, 1]
cat_img2 = cat_img1 + 10
# 在原来的像素上加10，若超过了255则溢出
print(cat_img2)
# 相当于%256
print(cat_img1 + cat_img2)

print("--------")
# 使用opencv的add函数，若超过255，则会变为255
print(cv2.add(cat_img1, cat_img2))
```



## 将两张图片融合在一起

融合在一起之前需要保证两个图片的大小相等，可以使用 resize

使用 addWeighted 函数将两个图片融合在一起

```python
cat_img = cv2.imread("data/01_Picture/01_cat.jpg")
dog_img = cv2.imread("data/01_Picture/03_dog.jpg")
print(cat_img.shape)
print(dog_img.shape)
# resize 之后的图片大小为414*500
dog_img = cv2.resize(dog_img, (500, 414))
print(dog_img.shape)

imageShow(dog_img)
# 将两个图片融合在一起, gamma 为偏置项
res = cv2.addWeighted(cat_img, 0.6, dog_img, 0.4, gamma=0)
imageShow(res)

# 长度变为原来的3倍，宽度不变
res1 = cv2.resize(dog_img, dsize=(0, 0), fx=3, fy=1)
imageShow(res1)
```



## 图像阈值

<img src="https://img.leftover.cn/img-md/202411051535321.png" alt="image-20241105153516187" style="zoom:50%;" />

```python
cat_img = cv2.imread("data/01_Picture/01_cat.jpg")

ret, threshold1 = cv2.threshold(cat_img, 127, 255, type=cv2.THRESH_BINARY)
ret, threshold2 = cv2.threshold(cat_img, 127, 255, type=cv2.THRESH_BINARY_INV)
ret, threshold3 = cv2.threshold(cat_img, 127, 255, type=cv2.THRESH_TRUNC)
ret, threshold4 = cv2.threshold(cat_img, 127, 255, type=cv2.THRESH_TOZERO)
ret, threshold5 = cv2.threshold(cat_img, 127, 255, type=cv2.THRESH_TOZERO_INV)

images = [cat_img, threshold1, threshold2, threshold3, threshold4, threshold5]
for i in range(len(images)):
  imageShow(images[i])
```



## 滤波

滤波是一种图像处理技术，用于对图像中的像素值进行操作，从而达到不同的效果。滤波可以用于`去噪`、`平滑`、`边缘检测`、`锐化`等任务

```python
lena_noise = cv2.imread("data/01_Picture/04_LenaNoise.png")
imageShow(lena_noise)
# 均值滤波
blur_img = cv2.blur(lena_noise, ksize=(3, 3))
# imageShow(blur_img)
# ddepth 为输出图像的深度， -1 表示和输入图像相同
# normalize 表示是否进行归一化，True表示是，即取均值，False则不进行归一化，若相加之后超过255，则取255
# blur算是boxFilter 的一种简化版本
box_img1 = cv2.boxFilter(lena_noise, ddepth=-1, ksize=(3, 3), normalize=True)
imageShow(box_img1)
box_img2 = cv2.boxFilter(lena_noise, ddepth=-1, ksize=(3, 3), normalize=False)
imageShow(box_img2)

# 高斯滤波
gaussian_img = cv2.GaussianBlur(lena_noise, (3, 3), sigmaX=1)
# imageShow(gaussian_img)

# 中值滤波 ，使用中值代替，去噪声效果最好
median_img = cv2.medianBlur(lena_noise, 3)
# imageShow(median_img)

total_img = np.hstack([blur_img, gaussian_img, median_img])
imageShow(total_img)
```

## 形态学操作

###  腐蚀操作 和膨胀操作

**腐蚀操作原理：** 将图像中的每个像素与内核进行比较，若内核覆盖的区域内所有像素值都为**非零值**，那么该像素保持不变，否则像素值变为 0

> 1. 可用来去除小的白色噪点
>2. 可以让边界变薄，使对象的轮廓更清晰

**膨胀操作原理：**膨胀操作是腐蚀操作的逆运算，将图像中的每个像素与内核进行比较，若内核覆盖的区域内**至少有一个像素为非 0**，那么该像素被更新为 255

> 1. 可以填充前景中的小孔
>2. 连接断开的区域
>3. 会让前景物体的轮廓增厚

```python
def imageShow(img):
  cv2.imshow("image", img)
  cv2.waitKey(0)
  cv2.destroyAllWindows()
  cv2.waitKey(1)
dige_img = cv2.imread("data/01_Picture/05_Dige.png")
# imageShow(dige_img)

# 腐蚀
kernel = np.ones((3, 3), dtype=np.uint8)
# iterations 迭代次数
erode_1 = cv2.erode(dige_img, kernel, iterations=1)
# imageShow(erode_1)
erode_2 = cv2.erode(dige_img, kernel, iterations=2)

# 可以看出明显迭代2次的图片的线条更细
erodes = np.hstack([erode_1, erode_2])
imageShow(erodes)

# 膨胀
dilate_1 = cv2.dilate(erode_1, kernel, iterations=1)
imageShow(dilate_1)

```

### 开运算和闭运算

```python
# 开运算： 先腐蚀再膨胀
opening = cv2.morphologyEx(dige_img, cv2.MORPH_OPEN, kernel)
imageShow(opening)

# 闭运算： 先膨胀再腐蚀
closing = cv2.morphologyEx(dige_img, cv2.MORPH_CLOSE, kernel)
imageShow(closing)
```

### 梯度运算

对原始图像分别进行腐蚀和膨胀操作，再将膨胀的图像-腐蚀的图像，这样我们可以得到原始图像的轮廓信息

```python
pie = cv2.imread("data/01_Picture/06_pie.png")
gradient_img = cv2.morphologyEx(pie, cv2.MORPH_GRADIENT, kernel)
imageShow(gradient_img)
```

### 礼帽和黑帽

在这个例子中：

- 开运算得到了一张不带刺的图像，礼帽 =  原始输入图像 - 开运算 ，得到了一张只有刺的图像
- 闭运算得到了一张带刺的图像，黑帽 =  闭运算 - 原始输入图像 ，得到了一张有许多白点的图像，表示出了原始图像的轮廓

```python
# 礼帽 = 原始输入图像 - 开运算  
tophat_img = cv2.morphologyEx(dige_img, cv2.MORPH_TOPHAT, kernel)
imageShow(tophat_img)

# 黑帽 =  闭运算 - 原始输入图像 

blackhat_img = cv2.morphologyEx(dige_img, cv2.MORPH_BLACKHAT, kernel)
imageShow(blackhat_img)
```



## 图形梯度计算

图形梯度计算通过找到图形的边界，来描绘图像的轮廓

### sobel 算子 、Laplacian 算子 和 Scharr 算子的比较

- Scharr 更敏感一点，描绘的细节更丰富
- Laplacian 不敏感，对于边界轮廓的细节描绘的没那么丰富
- sobel 介于二者之间，相比 Scharr 更能抗噪声

```python
# sobel算子
sobel_x = cv2.Sobel(lena, cv2.CV_64F, dx=1, dy=0, ksize=3)
# 将负数转为正数
sobel_x = np.uint8(np.absolute(sobel_x))

sobel_y = cv2.Sobel(lena, cv2.CV_64F, dx=0, dy=1, ksize=3)
sobel_y = np.uint8(np.absolute(sobel_y))

# 将y轴和x轴方向的进行融合
sobel_xy = cv2.addWeighted(sobel_x, 0.5, sobel_y, 0.5, 0)

# Scharr算子
scharr_x = cv2.Scharr(lena, cv2.CV_64F, 1, 0)
scharr_y = cv2.Scharr(lena, cv2.CV_64F, 0, 1)

scharr_x = cv2.convertScaleAbs(scharr_x)
scharr_y = cv2.convertScaleAbs(scharr_y)

scharr_xy = cv2.addWeighted(scharr_x, 0.5, scharr_y, 0.5, 0)
 
# laplacian 算子
laplacian = cv2.Laplacian(lena, cv2.CV_64F)
laplacian = cv2.convertScaleAbs(laplacian)

images = np.hstack([sobel_xy, scharr_xy, laplacian])
imageShow(images)
```

> ⚠️：因为算子算出的结果有正有负，因此我们使用`cv2.CV_64F` 来保存数据，而不是`cv2.U8`,但是图像展示的时候不能有负数，我们需要使用`convertScaleAbs`将负数转为正数

## Canny 边缘检测

<img src="https://img.leftover.cn/img-md/202411070920286.png" alt="image-20241107092021138" style="zoom:50%;" />

**使用插值法计算梯度方向上的点的像素**

<img src="https://img.leftover.cn/img-md/202411070920704.png" alt="image-20241107092037644" style="zoom: 67%;" />

**使用简单方法近似计算梯度方向上的点的梯度**

<img src="https://img.leftover.cn/img-md/202411070921594.png" alt="image-20241107092125518" style="zoom: 67%;" />

**双阈值检测：**

<img src="https://img.leftover.cn/img-md/202411070923528.png" alt="image-20241107092305442" style="zoom:50%;" />

```python
lena = cv2.imread("data/01_Picture/07_Lena.jpg", cv2.IMREAD_GRAYSCALE)
imageShow(lena)

# 最大最小阈值的影响，
# 当最大最小阈值比较小的时候，则会对边缘信息更加敏感，可以捕捉到更多的细节，但是也可能引入一些噪音
# 当最大最小阈值比较大的时候，则会对边缘信息不那么敏感，捕捉到的细节就更少
canny_1 = cv2.Canny(lena, 50, 100)
canny_2 = cv2.Canny(lena, 80, 150)

res = np.hstack([canny_1,canny_2])
imageShow(res)
```

## 图像金字塔

图像金字塔（Image Pyramid）是一种多尺度表示方法，通过不断缩小或放大图像的分辨率，生成一系列不同尺度的图像。图像金字塔有两种主要类型：高斯金字塔（Gaussian Pyramid）和拉普拉斯金字塔（Laplacian Pyramid）





### 高斯金字塔

**高斯金字塔原理：** 

- 向下采样：
 <img src="https://img.leftover.cn/img-md/202411071257641.png" alt="image-20241107125742491" style="zoom: 25%;" />

- 向上采样：

   <img src="https://img.leftover.cn/img-md/202411071259432.png" alt="image-20241107125905357" style="zoom: 50%;" />

```python
am_img = cv2.imread("data/01_Picture/09_AM.png")
print(am_img.shape)
imageShow(am_img)
# 高斯金字塔

# 向下采样，长宽变为原来的1/2 ，面积变为原来的1/4
am_down = cv2.pyrDown(am_img)
imageShow(am_down)

# 向上采样，长宽变为原来的2倍 ，面积变为原来的4倍
am_up = cv2.pyrUp(am_img)
print(am_up.shape)
imageShow(am_up)

am_up1 = cv2.pyrUp(am_up)
print(am_up1.shape)
imageShow(am_up1)
```

### 拉普拉斯金字塔

拉普拉斯金字塔其实是在高斯金字塔的基础上进行变化的。

**如何构建拉普拉斯金字塔？**

1. 将原始图像作为高斯金字塔的第一层
2. 然后对每一层图像进行下采样，得到下一层，从而构建出高斯金字塔
3. 拉普拉斯金字塔的最小层直接等于高斯金字塔的最小层，因为它没有更低分辨率的图像来计算差值。
4. 逐层计算差值来构建拉普拉斯金字塔：
   - 从倒数第二层的高斯金字塔开始，对当前层的图像上采样，将上一层的高斯图像与上采样后的图像相减，得到该层的拉普拉斯图像
   - 重复该过程，直到得到每一层的拉普拉斯金字塔图像

**具体可看图像金字塔做图像融合的代码**

### 图像金字塔做图像融合

```python

A = cv2.imread("data/01_Picture/01_cat.jpg")
B = cv2.imread("data/01_Picture/03_dog.jpg")
B = cv2.resize(B, (500, 414))
# imageShow(A)
# imageShow(B)

level = 6
G = A.copy()

# A的高斯金字塔
gpA = [G]
for i in range(level):
  G = cv2.pyrDown(G)
  gpA.append(G)

# B的高斯金字塔
G = B.copy()
gpB = [G]
for i in range(level):
  G = cv2.pyrDown(G)
  gpB.append(G)

# 构建A的拉普拉斯金字塔
lpA = [gpA[5]]
for i in range(level - 1, 0, -1):
  GE = cv2.pyrUp(gpA[i], dstsize=(gpA[i - 1].shape[1], gpA[i - 1].shape[0]))
  L = cv2.subtract(gpA[i - 1], GE)
  lpA.append(L)

# 构建B的拉普拉斯金字塔
lpB = [gpB[5]]
for i in range(level - 1, 0, -1):
  GE = cv2.pyrUp(gpB[i], dstsize=(gpB[i - 1].shape[1], gpB[i - 1].shape[0]))
  L = cv2.subtract(gpB[i - 1], GE)
  lpB.append(L)

# 在每一层上融合左右部分
LS = []
for la, lb in zip(lpA, lpB):
  rows, cols, channels = la.shape
  ls = np.hstack([la[:, 0:cols // 2], lb[:, cols // 2:]])
  LS.append(ls)

# 重建融合图像
# 重建融合图像的目的是将多层拉普拉斯金字塔中的细节信息和结构信息逐层叠加，最终形成一张完整的高分辨率图像
ls_ = LS[0]
for i in range(1, 6):
  ls_ = cv2.pyrUp(ls_, dstsize=(LS[i].shape[1], LS[i].shape[0]))
  ls_ = cv2.add(ls_, LS[i])
imageShow(ls_)
```



## 轮廓

### 轮廓检测

> 注意⚠️：想要画出物体的轮廓，我们要先将原始图像转为灰度图（读取的时候不能读取为灰度图，因为最后画图的时候是要在原图上画，读取为灰度图的话就画不了颜色），再使用 threshold 函数二值化，这样更容易得到轮廓信息，之后调用 findContours 得到轮廓信息，最后使用 drawContours 画出轮廓

![image-20241107201542198](https://img.leftover.cn/img-md/202411072015341.png)

> ⚠️注意：drawContours 函数会改变原图像，因此画轮廓的时候需要 copy 一份

```python
contour_img = cv2.imread("data/01_Picture/10_contours.png")
print(contour_img.shape)
# imageShow(contour_img)

gray = cv2.cvtColor(contour_img, cv2.COLOR_BGR2GRAY)
imageShow(gray)
ret, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
contours, hierarchy = cv2.findContours(binary, mode=cv2.RETR_TREE, method=cv2.CHAIN_APPROX_NONE)
draw_image = contour_img.copy()
# contourIdx：要画哪一个轮廓，-1则表示画所有的轮廓
# thickness：线条的宽度
res = cv2.drawContours(draw_image, contours, contourIdx=-1,, color=(0, 255, 0), thickness=1)
imageShow(res)


# 画第二条轮廓
draw_image1 = contour_img.copy()
res1 = cv2.drawContours(draw_image1, contours, 1, color=(0, 255, 0), thickness=1)
imageShow(res1)
```



### 轮廓特征

就是计算一些轮廓的信息，例如轮面积、轮廓周长

```python
# 轮廓特征 
# 只能对单个轮廓进行计算
cnt = contours[0]
# 轮廓面积
print(cv2.contourArea(cnt))
# 轮廓周长
print(cv2.arcLength(cnt, True))
```

### 轮廓近似

**轮廓近似**是一种通过减少轮廓点数来简化轮廓的方法。在图像处理中，轮廓常常包含大量的点（特别是在使用 cv2.CHAIN_APPROX_NONE 提取轮廓时，每个轮廓的所有点都会被保留），这会导致存储和处理的开销增加。轮廓近似通过消除冗余点，仅保留拐点或轮廓的关键点，从而使轮廓更加简单，降低计算成本。

```python
img = cv2.imread("data/01_Picture/11_contours2.png")
# imageShow(img)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

_, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

contours, hierarchy = cv2.findContours(binary, mode=cv2.RETR_TREE, method=cv2.CHAIN_APPROX_NONE)
# 取第一个轮廓
cnt = contours[0]
draw_image = img.copy()
res = cv2.drawContours(draw_image, [cnt], -1, (0, 0, 255), 1)
imageShow(res)

# 近似的阈值，一般会根据轮廓的周长进行设置，这里设置为0.15*周长
epsilon = 0.05 * cv2.arcLength(cnt, True)
# 近似之后的轮廓
approx = cv2.approxPolyDP(cnt, epsilon, True)
# 画出对应的轮廓

draw_image1 = img.copy()
res = cv2.drawContours(draw_image1, [approx], -1, (0, 0, 255), 1)
imageShow(res)
```

## 模版匹配

```python
# 模版匹配中，method 比较重要！，这次选的是平方差，平方差越小越好，因此下面取的是最小值对应的位置
res = cv2.matchTemplate(lera, face, method=cv2.TM_SQDIFF_NORMED)
imageShow(res)
min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)
ret = cv2.rectangle(lera, min_loc, (min_loc[0] + w, min_loc[1] + h), color=(0, 0, 255), thickness=2)
imageShow(ret)
```

```python
# 模版匹配多个
coin = cv2.imread("data/01_Picture/15_Mario_coin.jpg")
h, w = coin.shape[:2]
mario = cv2.imread("data/01_Picture/14_Mario.jpg")

# 这里得出的是相关性，相关性越高越好，我们认为相关性>0.8就合格
res = cv2.matchTemplate(mario, coin, method=cv2.TM_CCORR_NORMED)
# 认为相关性>0.8的就符合
threshold = 0.8
# 得到的是res > threshold 的下标
loc = np.where(res >= threshold)

# 画出所有的矩形框
for pt in zip(*loc[::-1]):
  bottom_right = (pt[0] + w, pt[1] + h)
  cv2.rectangle(mario, pt, bottom_right, color=(0, 0, 255), thickness=1)
imageShow(mario)
```



# 直方图 以及均衡化（增强对比度）

在数字图像中，像素值（灰度值）分布不均衡会导致图像的对比度低，比如大多数像素都集中在较暗或较亮的范围。均衡化的原理是通过重新分配像素值，使得图像的灰度直方图更加均匀，从而增强对比度。

<img src="https://img.leftover.cn/img-md/202411091028075.png" alt="image-20241109102840926" style="zoom: 60%;" />

```python
# 画图像的直方图
img = cv2.imread("data/01_Picture/01_cat.jpg")
imageShow(img)
plt.hist(img.ravel(), 256)
plt.show()


# 求出每个像素点的个数，画出折线图
colors = ("b", "g", "r")
for i, color in enumerate(colors):
  cv_hist = cv2.calcHist([img], [i], None, [256], [0, 256])
  plt.plot(cv_hist, color=color)
  plt.xlim([0, 256])
plt.show()
```

**均衡化：**

对整个图像进行均衡化处理，可以增加图像的对比度，但是对整个图像进行均衡化处理有个缺点：就是容易丢失一些细节，因此后面提出了自适应均衡化，即将图像划分为很多个小的图像，分别对小图像进行均衡化处理（but 对于一些有噪声的地方，容易受到噪声的影响，对噪声比较敏感）

```python
cat_img = cv2.imread("data/01_Picture/01_cat.jpg", cv2.IMREAD_GRAYSCALE)
plt.subplot(211)
plt.hist(cat_img.ravel(), 256)

# 做均衡化 ，可以看出做了均衡化之后像素的分布会更均匀，可以增加图像的对比度，图像会变亮
eqz_img = cv2.equalizeHist(cat_img)
plt.subplot(212)
plt.hist(eqz_img.ravel(), 256)
plt.show()
```

**自适应均衡化：**

自适应均衡化的思想就是把整个图像分割成很多个小的图像，例如（8，8），分别对每个小的图像做均衡化。



```python
clahe_img = cv2.imread("data/01_Picture/16_Clahe.jpg", cv2.IMREAD_GRAYSCALE)

# 普通均衡化
eqz_img = cv2.equalizeHist(clahe_img)

# 自适应均衡化
# clipLimit ：clipLimit 限制了直方图中某个灰度值的最大像素数
#	•	直方图裁剪：在每个小块中，clipLimit 限制了直方图中某个灰度值的最大像素数。如果某个像素值的频次超过了 clipLimit，超出的部分会被裁剪掉。
#	•	重新分布：裁剪掉的部分像素会被均匀分布到直方图的其他灰度值中，避免某些灰度值的过度累积。

# tileGridSize：网格的大小
clahe = cv2.createCLAHE(clipLimit = 40.0, tileGridSize=(8, 8))
enchance_img = clahe.apply(clahe_img)

# 对比不同的均衡化的效果
res = np.hstack([clahe_img, eqz_img, enchance_img])
imageShow(res)
```



# Harris 角点检测

角点检测就是检测图像中类似下图所示，红色的点就是角点

<img src="https://img.leftover.cn/img-md/202411191837659.png" alt="image-20241119183701510" style="zoom:25%;" />

```python
origin_img = cv2.imread("data/01_Picture/17_Chessboard.jpg")

gray = cv2.cvtColor(origin_img, cv2.COLOR_BGR2GRAY)
print(gray.shape)

# blockSize : 角点检测值指定区域的大小 一般为2，3
# ksize ：指定用于计算图像梯度的 Sobel 算子的大小。 一般为3，5
#  k (Harris 角点检测参数)：通常取值再0.04-0.06之间，一般为0.04
dst = cv2.cornerHarris(gray, 2, 3, 0.04)
print(dst.max())
# imageShow(origin_img)


origin_copy = origin_img.copy()
# dst大于0.1 * dst.max() 的点的像素值变为红色
# 非极大值抑制NMS，将一些真正的角点标记为红色
origin_copy[dst > 0.01 * dst.max()] = [0, 0, 255]
imageShow(origin_copy)
```



# SIFT（局部特征提取方法）



关键点：角点、边缘点

为每个关键点生成一个描述符（向量），表示该关键点的局部特征。

描述符可以用于图像间的关键点匹配

## 一对一匹配

```python
image = cv2.imread("data/01_Picture/17_Chessboard.jpg")
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

sift = cv2.SIFT.create()
# 得到特征点，keypoints
kp = sift.detect(gray)

# 画出keypoints
image = cv2.drawKeypoints(gray, kp, image)
imageShow(image)

# 计算描述符，一般是有（ len(kp）,128) ,每一行是128维，用了描述keypoint
kp, des = sift.compute(gray, kp)
```

## K 对最佳匹配(knnMatch)

```python
bf =cv2.BFMatcher()
matches2 = bf.knnMatch(des1, des2, k=2)
good = []
for m, n in matches2:
  if m.distance < 0.75 * n.distance:
    good.append([m])
    
match_img2 = cv2.drawMatchesKnn(box_template, kp1, box_in_scene, kp2, good, None, flags=2)
imageShow(match_img2)
```





# 需要注意的点

1. opencv 中颜色通道的顺序为 BGR

2. 使用 Matplotlib 展示图像的时候需要将 axis 去掉

   > 倘若你没有把 axis 去掉，展示出的图片颜色不对，很奇怪

   ``` python
   img = cv2.imread("data/01_Picture/01_cat.jpg")
   imageShow(img)
   # print(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
   plt.axis('off')
   img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
   plt.imshow(img_rgb)
   
   ```

   