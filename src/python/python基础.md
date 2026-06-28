## 数据结构

- 不可变类型：数字（Number，包含 int、float、bool、复数（complex））、字符串、布尔类型

  > python3 中 bool 是 int 的子类

- 可变类型：列表（list）、集合（set）、字典（dict）

  > 我们常用 type 和 isintance 来判断数据类型，二者的区别为
  >
  >- type 不会认为子类是父类类型
  >
  >- isinstance（） 会认为子类是父类类型
  >
  >  例如 isinstance(False,int) -> true

- 高级数据结构：byte

  使用 b“xxxx” 或者 bytes（）来声明 byte

  ```python
  c = b"hjhjh"
  print(type(c)) # <class 'bytes'>
  
  d = bytes("hjhjhjhj", encoding="utf-8")
  ```

## 运算符

/ :  除，得到的是一个浮点数

// : 整除， 得到的是一个整数

** ： 指数 ，例如 2**4 为 2 的 4 次方

/= : c/=a 即 c=c/a

//= : c//=a  即 c=c//a

\*\*=： c\*\*=a 即 c = c ** a

### 逻辑运算符

and ， or ,not 

### 位运算符

& 按位与

｜ 按位或

^ 按位异或

~ 按位取反

<<  左移

\>\> 右移

### 身份运算符

 is 判断两个标识符是不是引用自一个对象,比如 x is y 类似于 id(x) == id(y)

 is not  x is not y 类似于 id(x) != id(y)

 id（）函数用于获取对象的内存地址

⚠️is 与 == 区别：

is 用于判断两个变量引用对象是否为同一个， == 用于判断引用变量的值是否相等。

### Python 成员运算符

可用于字符串，列表，元组等等

```python
str1="ajgja"
if("a" in str1):
  print(f"a in str")
else: print(f"a not in str")
```



### 海象运算符

```python
# 海象运算符，可以在表达式内部进行赋值操作，在java中是可以直接赋值的，在python中需要使用海象运算符
if (l := len(b)) > 2:
  print(11)
```



## 字符串

1. 字符串定义方式（3 种）

![image-20240507000749459](https://img.leftover.cn/img-md/202405070007536.png)
2. 字符串拼接
python 中字符串不能使用 + 不能和其他的数据类型的变量进行拼接，除非将其转为字符串
print("hh"+3) ❌
print("hh" + str(3)) ✅

3. 字符串格式化

     %d 表示整数（只能传入整数，浮点数，不能传入字符串）

     %f 表示浮点数 （只能传入浮点数，整数，不能传入字符串）

     %s 表示的是字符串（传入的是其他数据类型也没事，会自动转为字符串）

     第二种格式化方式不会做精度控制，会更优雅一点

     ```python
     # 第一种格式化方式 ，使用 % 的语法
     message = "my name is %s, age is %d" % ("zwc", 18)
     # 第二种格式化的方式 f"xxx {} ,xxx {}"
     print("%5.2f" % 3.8123)
     name ="zwc1"
     age =19
     print(f"my name is {name}, age is {age}")
     ```

4. 控制数字的精度

   使用`m.n`来控制数字的精度

   - m : 控制整个的宽度，若设置的宽度小于数字本身，则不生效，若大于数字本身的宽度，则数字前面补空格（这个一般很少使用）
   - n ：控制小数点的精度，会四舍五入

   ```python
   print("%5.2f" % 3.8123) # 这里要求2有效数字，整数只有一位 + 小数点一位 +2位小数 =4位，因此数字前面补一个空格
   ```

## 输入

input 语句接收键盘的输入

```python
name1 = input("你是谁: \n")
print(name1)
```

## If 语句

If 语句的代码块是根据缩进来判断的，跟别的语言不一样

基本语法如下：

```python

age = int(input("你的年龄:\n"))

if age >= 18:
  print("age > 18")
  print("ni yi jing chengnian")
  print("ni jing ru daxue le ")

elif age > 10:
  print("age >10 <=18")
else:
  print("age <=10")
  print("ni wei cheng nian")
```

if 语句的嵌套

```python
if age > 18:
  print("age >18")
  if age > 30:
    print("age >30")
  else:
    print("age >18 and age <=30")

else:
  print("age <=18")
```

### 三目运算符

```python
  a = int(input())
  # python的三目运算符
  b = 3 if a > 3 else 9
```

### match case 语法

````python
num = 111

match num:
  case 0:
    print("0000")
  case 1:
    print("111")
  case 2:
    print("222")
  case 3 | 4:
    print("3334444")
    # 相当于default
  case _:
    print("无法识别")
````





## 循环语句

### while 循环

```python
i = 1
while (i <= 9):
  j = 1
  while (j <= i):
    print(f"{i}*{j}={i * j}\t", end="")
    j += 1
  print("")
  i += 1
```

### For 循环

```python
n = 1
for n in range(9):
  print(n, end=" ")
  n += 1
else:
  print("循环结束")
```

range 的三种用法

```python
# range（start ，end ,step）,[start, end )
for i  in range(10):
  print(f"{i}",end=" ")

print()
for i in range(2,9):
  print(f"{i}",end=" ")

print()

for i in range(2,11,2):
  print(f"{i}",end=" ")
```

⚠️ 对于 for 循环遍历的那个变量，在循环结束之后也能访问到，但是不建议这样做，例如下面最后打印出 m=3

```python
for m in range(4):
  print(m,end=" ")

print(m) # 3
```

 ⚠️ for else 语句 ，若直接在 for 循环中 break 出去是不会执行 else 中的语句的，只有遍历完所有的元素才会执行 else 中的语句





### 函数

函数如果没有指明返回值，则返回的是 None

#### 编写函数说明

```python

def Mymax(a, b):
  # 写函数说明
  """
阿可根据阿胶糕即
  :param a: a嘎嘎解决
  :param b: 嘎嘎好
  :return: 个哈哈
  """
  c = a if a > b else b
  return c


print(Mymax(2, 3))

```

### global 关键字

```python
num = 100
def pritfNum():
  # 设置内部定义的变量为全局变量
  global num
  num = 2000

pritfNum()
print(num) # 2000

```

Lambda 表达式创建匿名函数

```python
sum = lambda a, b: a + b
max1 = lambda a, b: a if a > b else b
print(sum(10, 40))  # 50
print(max1(90,70)) # 90

```


## 数据容器

### 字符串

Python 不支持单字符类型，单字符在 Python 中也是作为一个字符串使用

```python
str = "hello,world"
print(str[4])
print(str[1:5])  # 截取字符串，左开右闭
print(str * 3)  # 重复字符串
print('d' in str)  # 判断某个子串是否存在
print('d' not in str)  # 判断某个子串是否存在
print("my name is %s ,age is %d" % ("zwc", 19))  # %运算符格式化字符串

# 使用""" """ 声明的字符串所见即所得，不需要通过转义字符来换行
str1 ="""
  hello 
   world
zwc
nihao   
"""
print(str1)

print(str1.upper())

str2 = str.replace("llo", "ziziz")  # 替换字符串，heziziz,world
print(str2)

list1 = str2.split(",")  # 分割字符串，返回一个list
print(list1)

str3 = str2.strip()  # 移除前后的空格
print(str3)

str4 = str2.strip("ld")  # 移除前后指定的字符串
print(str4)

print(str3.count("z")) # 统计z出现的次数
print(len(str3))

```



### list（列表）

python 中的列表与 Java 的 List 类似，都是有序、可重复

```python
# 定义空列表
list1 = list()
# or
list1 = []
print(list1)

list2 = ["hello", "zwc", 18, True]
list2.append("hhh")
list2.append([1, 4, 7])  # append 函数是插入单个元素
print(list2)  # ['hello', 'zwc', 18, True, 'hhh', [1, 4, 7]]

print(list2[1:4])  # 列表的截取 ,左开右闭
print(list2[1])  # 下标为1的元素 zwc
print(list2[-1])  # 倒数第一个元素 [1, 4, 7]

print(list2[-1][2])  # 取出嵌套列表中的元素 7
print(list2.index("zwc"))  # index函数，在list中查找某个元素的下标，没找到会抛出异常

list2[1] = "zwc1"  # 修改某个元素的值
print(list2)

list2.insert(2, "xixi")  # 在下标为2的位置插入元素
print(list2)
# extend ，传入一个容器对象，将容器中的所有元素都插入进来
list2.extend([1, 23, 545])  # ['hello', 'zwc1', 'xixi', 18, True, 'hhh', [1, 4, 7], 1, 23, 545]
print(list2)

del list2[2]  # 删除下标为2的元素
print(list2)  # ['hello', 'zwc1', 18, True, 'hhh', [1, 4, 7], 1, 23, 545]

print(list2.pop(3))  # 删除下标为3的元素并返回对应的元素值，若没有传入下标，则默认删除最后一个
print(list2)

list2.remove(18)  # 删除第一次匹配到的元素 ['hello', 'zwc1', 'hhh', [1, 4, 7], 1, 23, 545]
print(list2)

print(list2.count("hello"))  # 统计列表中某个元素的个数  1

print(len(list2))  # 列表的长度 7

# while循环遍历列表

i = 0
while i < len(list2):
  print(list2[i], end=" ")
  i += 1

print()

# for 循环遍历列表

for num in list2:
  print(num, end=" ")

list2.clear()  # 清空列表

```



### Tuple（元组）

Python 的元组与 List 类似，不同之处在于元组的元素`不能修改`。

元组使用小括号，列表使用方括号

```python
tup1 = (1, 3, "jjj", "zwc", 10)
print(tup1[2])
print(tup1[-2])
print(tup1[1:3])
print(tup1.index(3))  # 查找某个元素的位置，没找到则抛出异常
print(len(tup1))
print(tup1.count(3))

tup2 = ("666", "hhg", 2, 4)

tup3 = tup1 + tup2
print(tup3)

print(tup3[::2])  # 步长为2
# 步长为负数时表示从后往前，start 要 > end
print(tup3[::-1])  # 等价于反转
print(tup3[5:1:-1])  # 从下标为5开始，往前取 ，步长为1 （取的元素下标为5，4，3，2）（左闭右开）
```





### set（集合）

set 的特点为无序，不可重复

```python
# 定义空集合
set1 = set()  # 不可以set1={} ,{} 是用来定义空字典的

# 定义非空集合
set2 = {1, 3, 4, 57, 8, 9, 3, 5, }
print(set2)

set2.add(100)  # 添加单个元素
print(set2)

set2.update([1, 4, 5, 6], [1014, 495])  # 也可以添加元素，参数可以是字符串，集合，列表，元组等等
print(set2)

set2.remove(3)  # 移除指定元素，不存在则报错
print(set2)

set2.discard(10000)  # 移除指定元素，不存在则什么都不干

set2.pop()  # 随机移除一个元素
print(set2)

set3 = {1, 4, 56, 0}
print(set3.difference(set2))  ## 差集 set3-set2

print(set3.intersection(set2))  # 交集

print(set3.union(set2))  # 并集

set2.difference_update(set3)  # set2中消除set2和set3中相同的元素

print(set2)
```



### dictionary (字典)

dict 的 key 只能是不可变类型(tuple，string 等) ，不能是可变类型（list，set，dict），value 可以是任意类型

```python
emptyDict = {}  # 定义空字典
emptyDict1 = dict()  # 定义空字典

dict1 = {"name": "zwc", "age": 18, "length1": 18, "hobby": "swim", }
dict1["name"] = "zwc1"  # 新增或者更新元素
print(dict1)
dict1.pop("name")  # 移除一个元素，若key 不存在，则报错
print(dict1)

dict1.popitem()  # 移除最后一个元素

print(dict1.keys())  # 获取所有的key

print(dict1.values())  # 获取所有的value，可以有相同的元素

dict1.update({"age": 19})  # 传入一个字典，将新字典中的所有元素添加到原字典中（重复的key则覆盖）

print(dict1)

for key in dict1:  # 遍历字典
  print(f"key is {key} ,value is {dict1[key]}")
print(len(dict1))  # 字典的长度

list1 = sorted(dict1, reverse=True)  # 将key排序，然后将所有的key 存储在list中并返回
print(type(list1))  # <class 'list'>
print(list1)

```





## 推导式

1. 列表推导式

```python
list1 = [1, 4, 5, 6, 8, 8, 10]

# if 写前面必须加else
list2 = [i if i % 2 == 0 else -i for i in list1]

# if 写在最后不能加else
list3 = [i for i in list1 if i % 2 == 0]
```

2. 元组推导式

   和其他的推导式不同，元组推导式返回的是一个生成器

   > 这种方法也可以快速生成一个生成器

   ```python
   # 返回的是一个生成器
   tuple1 = (i for i in list1 if i % 2 == 0)
   print(type(tuple1))  # <class 'generator'>
   # tuple函数转为tuple
   tuple2 = tuple(tuple1)
   print(tuple2)
   
   a = next(tuple1) # 使用next函数往下遍历
   print(a) 
   ```

3. 字典推导式

   ```python
   dict1 = {i: i ** 2 for i in list1 if i % 2 == 0}
   print(dict1)
   ```

   

## 函数

1. `def printInfo(info="hello", *args):`  = 表示默认参数，参数前面加`*` 表示可变参数，可变参数会以 tuple 的形式导入

2. 调用的时候也可以指定参数名： max1（b=1,a=3）

```python
def max1(a, b):
  if a > b:
    return a
  else:
    return b


print(max1(1, 4))


# 可变参数 + 默认参数
def printInfo(info="hello", *args):

  print(args)
  print(info, end="   ")
  for arg in args:
    print(arg, end=" ")


printInfo("hello", "world", "zwc", "18")

```

3. 参数前面加`**`,表示以字典的形式导入可变参数

   调用方式：`printInfo1("hello", name="zwc", age=18)`

   ```python
   def printInfo1(info, **vardict):
     print(info)
     # print(vardict)
     for key, value in vardict.items():
       print(f"{key}: {value}")
       
   printInfo1("hello", name="zwc", age=18)
   
   ```

   > 若可变参数在中间，则调用的时候之后的参数必须使用关键字参数，例如：
   >
   >def f(a,*var,b):
   >
   >​	xxx
   >
   >f（18,19,10,b=“zwc”）

4. 不带参数的返回值 返回`None`

5. 强制位置参数

   `/`可以强制前面的参数必须使用指定位置参数

   ```python
   #Python3.8 新增了一个函数形参语法 / 用来指明函数形参必须使用指定位置参数，不能使用关键字参数的形式。
   #在以下的例子中，形参 a 和 b 必须使用指定位置参数，c 或 d 可以是位置形参或关键字形参，而 e 和 f 要求为关键字形参:
   
   def f(a, b, /, c, d, *, e, f):
       print(a, b, c, d, e, f)
   ```

6. 强制关键字参数,

   `*` 可以强制后面的参数必须使用关键字参数

   ```python
   def hello(var1, *, var2):
     print(f"{var1},{var2}")
   
   
   hello(1, var2=2)
   ```

   

## lambda

lambda 可以用来创建匿名函数

```python
is_odd = lambda n: n % 2 == 1
mutil = lambda a, b: a * b

nums = [1, 23, 5, 3]
nums1 = list(map(lambda i: i * 2, nums))
print(nums1)


from functools import reduce
value = reduce(lambda prev, cur: prev + cur, nums, 0)
print(value)
```



## 迭代器

可以使用 iter（）函数从可迭代的对象中创建迭代器

1. 我们可以使用 for 循环来遍历

   ```python
   list1 = [1, 2, 45, 6, 73, 2]
   it = iter(list1)
   for i in it:
     print(i, end=" ")
   
   ```

2. 也可以使用 next 遍历

   > 通过 StopIteration 异常标识迭代的完成

```python
it1 = iter(list1)
while True:
  try:
    print(next(it1), end=" ")
  except StopIteration:
    break
```

3. 创建迭代器

   如果需要将一个类当作迭代器使用，需要实现`__iter__() 与 __next__()` 方法

   `__iter__()`方法返回一个特殊的可迭代的对象，这个迭代器对象实现了`__next__()`方法，且通过抛出 StopIteration 异常标识迭代的完成

   `__next__()` 方法会返回下一个迭代器对象

```python
class MyNumbers():
  def __iter__(self):
    self.a = 1;
    return self;

  def __next__(self):
    if self.a <= 20:
      x = self.a
      self.a += 1
      return x
    else:
      raise StopIteration


myNum = MyNumbers()

it2 = iter(myNum)
for i in it2:
  print(i, end=" ")
# 输出1-20
```

4. 平常我们遍历的时候如果想要获取对应的索引值，可以使用`enumerate`

```python
for idx, value in enumerate(range(1,10)):
  print(f"{idx}--{value}", end=" ") # 0--1 1--2 2--3 3--4 4--5 5--6 6--7 7--8 8--9 
```

5. 同时循环两个或多个序列时，用 [`zip()`](https://docs.python.org/zh-cn/3/library/functions.html#zip) 函数可以将其内的元素一一匹配

```python
propmt = ["name", "age"]
decrption = ["zwc", 18]
for prop, answer in zip(propmt, decrption):
  print(f"{prop}---{answer}") 
# name---zwc
# age---18
  

```



## 生成器

在 Python 中，使用了 **yield** 的函数被称为生成器（generator）。

**yield** 是一个关键字，用于定义生成器函数，生成器函数是一种特殊的函数，可以在迭代过程中逐步产生值，而不是一次性返回所有结果。

跟普通函数不同的是，**生成器是一个返回迭代器的函数**，只能用于迭代操作，更简单点理解生成器就是一个迭代器。



> 当在生成器函数中使用 **yield** 语句时，函数的执行将会暂停，并将 **yield** 后面的表达式作为当前迭代的值返回。
>
> 然后，每次调用生成器的 **next()** 方法或使用 **for** 循环进行迭代时，函数会从上次暂停的地方继续执行，直到再次遇到 **yield** 语句。这样，生成器函数可以逐步产生值，而不需要一次性计算并返回所有结果。
>
> 调用一个生成器函数，返回的是一个迭代器对象。

```python
# 这是一个生成器函数,调用这个函数会得到一个迭代器
def count_down(n):
  while n > 0:
    yield n - 2
    n -= 2
  else:
    print("迭代结束")


f = count_down(20)

for i in f:
  print(i, end=" ")
# 18 16 14 12 10 8 6 4 2 0 迭代结束
```

## 面向对象编程

1. python 中每个函数的第一个参数都是`对象实例`（一般命名为 self，当然也可以命名为其他）

2. `__init__` 函数为构造函数

3. 以`_`开头的函数/属性为私有的，只能在类的内部访问

4. python 支持多继承

   > 下面这个例子中，Student 继承自 People，Child，调用方法时，先看自己有没有这个方法，若没有，则从左往右找父类的这个方法，因此下面例子的 say 方法调用的是 People 的 say 方法

```python
class People():
  def say(self):
    print("hello")


class Child():
  def cry(self):
    print("cry。。。")

  def say(self):
    print("child say")


# 集成自People
class Student(People, Child):
  def __init__(self, name, gender, age):
    self.__name = name
    self.__gender = gender
    self.age = age

  def get_gender(self):
    return self.__gender

  def get_name(self):
    return self.__name

  def __printf(self):
    print(111)


s = Student("zwc", "male", 18)

print(s.get_name())
print(s.get_gender())

print(s.age)
s.say()
# 调用child类的cry方法
s.cry()

```

5. dir（）方法以 list 的形式返回这个对象的所有属性和方法

6. `hasattr` 、`getattr`、`setattr` 等内置函数可以用来判断，获取，设置某个对象的`属性和方法`

```python
print(hasattr(s,"get_name"))
getattr()
setattr()
```

7. 类变量
 ```python
   # 集成自People
   class Student(People, Child):
     # 类变量
     count = 0
     def __init__(self, name, gender, age):
       # 访问类变量
       Student.count += 1
       self.__name = name
       self.__gender = gender
       self.age = age
   
   
   s = Student("zwc", "male", 18) 
   print(s.count) #  1
   s1 =Student("zwc1","22e",19)
   print(s1.count) # 2
   
   
 ```

8. 使用`__slots__`属性来限制类中的属性,如果当子类没有使用`__slots__`,则即使父类使用了`__slots__`,对子类也不生效，此时子类可以随意添加属性

   如果子类也使用`__slots__` ,那么子类有的属性为子类+父类中`__slots__`声明的

   ```python
   
   class Person():
     __slots__ = ("hobby")
   
     def __init__(self, hobby):
       self.hobby = hobby
   
   
   class Student(Person):
     __slots__ = ("name", "age")
   
     def __init__(self, name, age, hobby):
       super().__init__(hobby)
       self.name = name
       self.age = age
   ```

9. 使用`@property` 将一个方法当成属性调用，使用方法如下，这样就可以保持封装性，又可以简洁地访问属性

```python

class Dog():
  def __init__(self, age):
    self._age = age
    self._name = "zwc"

  @property
  def age(self):
    return self._age

  @age.setter
  def age(self, age):
    if age < 0:
      raise RuntimeError("age不能为负数")
    else:
      self._age = age

  # 只读属性
  @property
  def name(self):
    return self._name


dog = Dog(18)

print(dog.age)
dog.age = -1
print(dog.age)

```

10. 使用 enum 枚举类

    - 我们可以使用 Enum（）构造函数创建枚举类
    - 也可以让某个类继承 Enum（推荐这种，这种的 IDE 的提示更好）

    ```python
    from enum import Enum
    
    # 第一种
    Weekday = Enum("Weekday", ["Mon", "Tue", "Wed"])
    
    for name, number in Weekday._member_map_.items():
      print(f"{name}---{number} --- {number.value}")
    
    
    # 第二种
    class Weekday1(Enum):
      Mon = 1
      Tue = 2
      Wed = 3
      Thu = 4
    
    
    print(Weekday1.Mon.value)  # 1
    print(Weekday1(1))  # Weekday1.Mon
    
    for name, number in Weekday1._member_map_.items():
      print(f"{name} -- {number}")
    
    ```

### 元类编程

1. 元类：创建类的类 。 type 可以用来判断数据的类型，也可以用来创建类（type 就是元类）

```python
# 1. 使用type（）创建类
def say(self):
  print("hello")

# 参数： 1. 类名 2.集成的基类（tuple） 3. 属性名（dict）
User = type("User", (), {"name": "zwc", "say": say})

user = User()

print(type(user)) #  <class '__main__.User'>
print(user.name) #  zwc
user.say()# hello
 
print(type(type)) # <class 'type'>
```

2. 自定义元类来创建类

   使用 metaclass 来指定元类，如果不指定，则使用的是 type

   > 用元类来控制类的创建过程，可以在类创建的过程中动态添加属性和方法

   > 创建类的时候会先在当前类的定义中找 metaclass，找不到则找父类的 metaclass

```python
# 2. 自定义元类来创建类
class MyMetaClass(type):
  def __new__(cls, name, bases, attr):
    # 添加add方法
    attr["add"] = lambda self, value: self.append(value)
    return super(MyMetaClass, cls).__new__(cls, name, bases, attr)

# 需要指定metaclass属性
class MyList(List, metaclass=MyMetaClass):
  def __init__(self):
    super().__init__(self)


list1 = MyList()
list1.add(11)
print(list1)

```





## 类的内置魔法函数

1. \_\_str\_\_() 和 \_\_repl\_\_()

   > - repl 函数一般用于生成比较正式的字符串（一般是展示给开发者的，例如在 python 的交互式环境中打印某个对象）
   >- 而 str 函数用来生成对用户友好的字符串（例如代码中使用 print 打印某个对象，类似 Java 的 toString 方法）



2. 下面这些函数是比较两个类的大小的

   ```python
   __lt__
   __le__
   __ge__
   __gt__
   __eq__
   __ne__
   ```

   比较时会调用\_\_lt\_\_函数来进行比较大小

   ```python
   s = Student("zwc", 18, "fly")
   s1 = Student("zwc", 19, "fly")
   print(s < s1)
   
   ```

3. \_\_iter\_\_() 和 \_\_next\_\_()

   这两个函数一般配合使用，用于迭代的

   iter 函数返回一个可迭代的对象，然后 for 循环会调用这个可迭代对象的__next__()方法返回对应的值，直到遇到`StopIteration`错误时退出循环。

   ```python
   class MyNumbers():
     def __init__(self):
       self.a = 1
   
     def __iter__(self):
       return self
   
     def __next__(self):
       if self.a <= 20:
         x = self.a
         self.a += 1
         return x
       else:
         raise StopIteration
   ```

4. \_\_getitem\_\_()

   当自己的类想像 list 那样使用`下标`访问元素或者使用`切片`获取元素时，会调用这个方法得到对应的返回结果

   > 因为输入的参数既可能为数字，也可能为切片，因此需要进行一个判断

   ```python
   class MyNumber():
     
     def __getitem__(self, item):
       print(type(item))
       if isinstance(item, slice):
         start = item.start
         stop = item.stop
         if (start == None):
           start = 0
         return list(range(start, stop))
       elif isinstance(item, int):
         return item
       else:
         raise RuntimeError("输入的参数有误")
   ```

5. \_\_getattr\_\_ 、\_\_delattr\_\_、\_\_dir\_\_

   - 当访问类的属性时报错的时候，会调用\_\_getattr\_\_ 方法，返回对应的结果
   - 当调用 del（）函数时，会调用类的__delattr__方法
   - 当调用 dir（）函数时，会调用类的__dir__方法（该方法需要返回一个可迭代的对象），dir 方法会将这个可迭代的对象转换为 list 并排序

6. \_\_get\_\_ 、\_\_set\_\_、\_\_setattr\_\_ 、\_\_getattr\_\_的区别

   - \_\_setattr\_\_ 、\_\_getattr\_\_ 是用于`实例属性`的，当获取实例属性值/设置实例属性值时会调用\_\_setattr\_\_ 、\_\_getattr\_\_

   - 而 \_\_set\_\_、\_\_get\_\_ 是用于属性描述符的

   > 某个类，只要实现了\_\_get\_\_ 、\_\_set\_\_ 、\_\_del\_\_ 方法就可以被称为描述符

   > 如果这个类实现了 \_\_get\_\_ 、\_\_set\_\_ 方法，则称为数据描述符，如果只实现了 \_\_get\_\_ 方法则称为非数据描述符

   调用了 setattr2 次

   ```python
   class User:
     def __init__(self, name):
       self.name = name  # setattr调用
   
     # 对实例设置了属性就会调用该函数
     def __setattr__(self, key, value):
       print("setattr调用")
       super().__setattr__(key, value)
       
   user = User("zwc")
   print(user.name)
   user.age = 18  # setattr调用
   
   
   ```

   ```python
   # 此时User类就是描述符
   class User:
     def __init__(self, name):
       self.name = name  # setattr调用
   
     def __set__(self, instance, value):
       print("set调用")
       instance.name1 = value
   
     def __get__(self, instance, owner):
       print("get。。。")
   
   
   class Student:
     user1 = User("zwc111")
   
     # def __init__(self):
     #   self.user1 = User("zwc999")
   
   
   user = User("zwc")
   print(user.name)
   user.age = 18  # setattr调用
   
   s = Student()
   # 访问了描述符，调用get
   s.user1 #  调用__get__
   
   ```

   

7. \_\_getattr\_\_ 和 \_\_getattribute\_\_的区别：

   - getattr 魔法函数会在访问属性时**找不到属性**的时候会调用
   - \_\_getattribute\_\_ 魔法函数会在**访问属性的时候**都会调用，优先级最高，因此他可以劫持属性访问的过程

8. \_\_call\_\_()方法

   当实现了这个方法时，我们可以对类的实例调用，就像函数一样

   ```python
   class Student():
     def __call__(self, *args, **kwargs):
       print("我是Student类")
       
   s1 = Student("zwc", 18)
   # 直接像函数一样调用类的实例
   s1()
   ```

9. \_\_new\_\_() 和\_\_init\_\_

   \_\_new\_\_() 方法在 \_\_init\_\_ 方法前面调用，负责创建一个对象实例。而\_\_init\_\_方法会接收对象的实例，负责初始化的过程

   > 我们可以使用\_\_new\_\_() 方法实现单例模式，如果想控制对象的创建过程，可以实现\_\_new\_\_方法

   > ⚠️：如果 new 方法没有返回对象，则对象初始化的过程中不会调用 init 方法


```python
class Student():
  instance = None
  def __new__(cls, *args, **kwargs):
    if Student.instance == None:
      Student.instance = super(Student, cls).__new__(cls)
    return Student.instance

  def __init__(self, name, age):
    self.name = name
    self.age = age
    
s1 = Student("zwc", 18)
s2 = Student("zwc1", 19)

print(s1 ==s2) # True
```



## 属性查找的优先级

1. \_\_getattribute\_\_()， 无条件调用
2. 数据描述符的\_\_get\_\_：由 ① 触发调用 （若人为的重载了该 __getattribute__() 方法，可能会导致无法调用描述符）
3. 实例属性
4. 类属性
5. 非数据描述符\_\_get\_\_
6. 父类的属性
7. __getattr__() 方法



## 模块

1. 导入模块

> 导入模块的时候会自动执行模块下面的代码，因此我们常会使用\_\_name\_\_ == "\_\_main\_\_",这样导入的时候就不会执行了，方便模块的测试

> ⚠️ 以_开头的函数和变量是非 public 的，不应该直接被引用。但是 python 并不会阻止你访问 private 函数/变量

**规范：** 导入模块的时候建议从项目根目录开时写，而不要使用相对路径，

```python
from modul.utils import Mymax #✅
```

```python
from modul.utils import _min,Mymax

if __name__ == "__main__":
  # print(Mymax(8, 5))
  # print(Mymax(9, 4))
  #不应该导入private变量
  print(_min(0, 2))

```

2. \_\_init\_\_文件标识这个文件夹是一个包

   \_\_all\_\_ 可以限制这个包可以导出哪些 函数/模块

   ```python
   from modul.utils import Myabs
   
   __all__ = ['Myabs']
   
   ```

   **当你 import xx_package from ***时，会根据\_\_all\_\_ 来导入对应的包/模块

## 装饰器

### 使用函数实现装饰器

装饰器是一个返回函数的高阶函数

```python
# 打印函数执行时间的装饰器
def metric(fn):
  @functools.wraps(fn)
  def wrapper(*args, **kwargs):
    startTime = time.time_ns() // 1000
    result = fn(*args, **kwargs)
    endTime = time.time_ns() // 1000
    print('%s executed in %s ms' % (fn.__name__, endTime - startTime))
    return result

  return wrapper


# 使用
@metric
def fast(x, y):
  time.sleep(0.0012)
  return x + y;


```

⚠️ 如果装饰器本身需要传入参数，那么我们应该编写一个返回装饰器的高阶函数，如下：

```python
def log1(text):
  def log1_inner(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
      print(f"{__name__} -- {text}")
      return fn(*args, **kwargs)

    return wrapper

  return log1_inner


@log1("hhhhh")
def f1():
  pass

```

### 使用类实现装饰器

带参数装饰器

```python
class Repeat:
  def __init__(self, time):
    self.time = time

  def __call__(self, fn):
    class wrapper:
      def __init__(self1, fn):
        self1.fn = fn

      def __call__(self1, *args, **kwargs):
        for i in range(self.time):
          print(i)
        result = self1.fn(*args, **kwargs)
        return result

    return wrapper(fn)


@Repeat(time=3)
def f():
  print(111111)


f()

```

不带参数的装饰器

```python
class Log3:
  def __init__(self, fn):
    self.fn = fn

  def __call__(self, *args, **kwargs):
    print("start---")
    result = self.fn(*args, **kwargs)
    print("end---")
    return result
```



## 偏函数

所谓偏函数，就是把一个函数的某些参数固定住，返回一个新的函数

`functools.partial`方法可以帮助我们快速创建一个偏函数

```python
from functools import *

def compare(a, b, mode):
  if mode == 1:
    return max(a, b)
  elif mode == 2:
    return min(a, b)
  else:
    raise Exception('mode只能为1和2')


Mymax = partial(compare, mode=1)
Mymin = partial(compare, mode=2)
print(compare(1, 3, 1))
print(Mymax(1, 6))
print(Mymin(5, 3))

```

## IO 编程

### 文件操读写

#### 文件的读取

```python
file = open("./data.txt", mode="r", encoding="utf-8")

# 对文件内容按行遍历
for line in file:
  print(line, end="")

file.close()

print()
file = open("./data.txt", mode="r", encoding="utf-8")

# 读取15个字符
data = file.read(15)
print(data)
#  读取全部字符
print(file.read())

file.close()
print()

file = open("./data.txt", mode="r", encoding="utf-8")

# 读取一行数据
print(file.readline())

# 读取所有的行的数据，放入list中
dataList = file.readlines()
print(dataList)

file.close()

print()

#  类似Java的try with resource ，执行完代码块中的代码时，file会自动close
with  open("./data.txt", mode="r", encoding="utf-8") as file:
  for line in file:
    print(line, end="")

```



#### 文件的写入

```python
# 写入，从头开始写
with open("./test.txt", "w", encoding="utf-8") as file:
  file.write("hello,world")
  # 要调用flush才会真正写入到磁盘
  file.flush()

# 追加
with open("./test.txt", "a", encoding="utf-8") as file:
  file.write("zwczwc")
  # 要调用flush才会真正写入到磁盘
  file.flush()

```





## 异常处理

```python
try:
  1 / 0
  # print(111)
except (ZeroDivisionError) as e:
  print(e)
  # 没有异常的时候会执行
except ValueError as e:
  print(f"ValueError --- {e}")
else:
  print("没有异常")

finally:
  print("finally 块")

```

自定义异常类

```python
class MycustomError(ZeroDivisionError):
  def __init__(self, message, code):
    super().__init__(message)
    self.message = message
    self.code = code

  def __str__(self):
    return f"error message is {self.message},error code is {self.code}"


def divide(a, b):
  if (b == 0):
    raise MycustomError("不能除以0", 400)
  return a / b

divide(10,0)
```



## logging 和 assert

```python
import logging

# 将日志记录到文件中
logging.basicConfig(filename="./log.txt", level=logging.INFO)
a = int(input("请输入一个大于10的数字"))
# 断言
# assert a > 10, 'n <=10'
if a <= 10:
  logging.info("a <=10")

```



## json 序列化和反序列化

```python
import json

d = {"name": "zwc", "age": 18}

jsonStr = json.dumps(d)

# 序列化为json
print(type(jsonStr), jsonStr)

# 反序列化

d1 = json.loads(jsonStr)
print(type(d1), d1)


class Student:
  __slots__ = ["name", "age"]

  def __init__(self, name, age):
    self.name = name
    self.age = age


s1 = Student("zwc11", 19)
# 若class中定义了 __slots__ ，则没有__dict__ 属性
# print(s1.__dict__)

# default 可以定义序列化的方式，可以将需要序列化的对象转化为dict ，dumps函数会将dict序列化为json
studentJson = json.dumps(s1, default=lambda s1: {"name": s1.name, "age": s1.age})
print(studentJson)

# object_hook 可以定义反序列化的方式，loads方法会将json反序列化为dict，object_hook 可以定义如何将dict反序列化为对象
s2 = json.loads(studentJson, object_hook=lambda dict: Student(dict["name"], dict["age"]))

print(type(s1), s2)

print()
obj = dict(name='zwc888', age=20)

# 会将非ASCII字符等字符转换为unicode
s = json.dumps(obj, ensure_ascii=True)
print(s)
```

## 内置函数

- **all()**: 判断可迭代对象是否都为 true

- **any（）**： 判断可迭代对象是否全为 false，有一个为 true，则返回 true

- **ascii()**: 返回一个对象的字符串表示，类似 repl，但是这个函数会将非 ASCII 字符 专为 unicode 编码

- hex： 将一个数转为 16 进制

- bin：将一个数转为 2 进制

- oct:将一个整数转为 8 进制字符串

- chr: 将整数转为对应的字符

- ord: 和 chr 相反，ord 返回一个字符的整数表示

- int: 将字符串转为整数

  ```python
  str = '0o15'
  print(int(str, 8)) # 13
  ```

  

- slice()：slice 函数实现切片对象，主要用在切片操作函数里的参数传递

- callable（）：用于检查一个对象是否是可调用的。

  > 如果返回 True，object 仍然可能调用失败；但如果返回 False，调用对象 object 绝对不会成功。
  >
  > - 对于函数、方法、lambda 函式、 类以及实现了 **__call__** 方法的类实例, 它都返回 True。

- bytes() 和 bytearray（）,bytes 是 bytearray 的不可变版本

- complex() 用来创建复数

  > 也可以使用字面量创建复数， b =1+2j

- dir():不带参数时，返回**当前模块内**的变量、方法和定义的类型列表；带参数时，返回参数的属性、方法列表。如果参数包含方法__dir__()，该方法将被调用。如果参数不包含__dir__()，该方法将最大限度地收集参数信息。

- divmod()：接收 2 个数字，返回一个 tuple，包含商和余数

- eval（）：接收一个字符串表达式，返回这个字符串的执行结果

- exec（）：执行储存在字符串或文件中的 Python 语句，相比于 **eval**，**exec** 可以执行更复杂的 Python 代码。类似 js 的 eval

- getattr（）：返回一个对象的属性值（还可以提供默认值，若对象中没有这个属性，则返回默认值）

- format(): str.format（）函数增强了字符串格式化的功能，不过高版本的 python 一般都使用`f“”`来格式化

  具体可查询[菜鸟教程](https://www.runoob.com/python/att-string-format.html)

  ```python
  print("{},{}".format("zwc", 18))  # zwc ，18
  print("{name},{age}".format(name="zwc11", age="19"))
  
  print("{:.2f}".format(28.3233))  # 28.32
  print("{:+.2f}".format(28.3233))  # +28.32
  
  ```

- frozenset() :返回一个冻结的集合(不可变集合)，冻结后集合不能再添加或删除任何元素。

- globals（）：会以 dict 返回当前位置的全部全局变量。

- locals():以 dict 返回当前位置的全部局部变量。

- hash():获取对象的 hash 值，会调用对象的`__hash__`魔法方法

- id()：获取对象的内存地址

- issubclass（）：判断某个类是否是另一个类的子类

  ```python
  print(issubclass(bool, int)) # True
  ```

- reversed(): 返回一个**反转的迭代器**.参数可以是 list，tuple，range，str

- sorted(): 可以对所有可迭代的对象进行排序，`key参数可以自定义排序元素`

  ```python
  data = [
    ["德国", 10, 11, 16],
    ["荷兰", 10, 10, 14],
    ['美国', 39, 41, 16]
  ]
  # 根据金牌，银牌，铜牌，国家名称排序
  data1 = sorted(data, key=lambda item: (item[1], item[2], item[3], item[0]), )
  print(data1)
  ```

- super(): 用来调用父类的方法 ，而不需要直接使用父类的名字

  super（）支持多继承机制，根据`MRO(Method Resolution Order，方法解析顺序)`的规则，在多继承中自动决定调用哪个父类

  > 可以使用 `类名.mro()`来查看当前类的 mro

  例如下面的这个例子，会根据 mro 链中的顺序找到对应的类是否有这个方法，

  - 有这个方法则调用，如果这个类还调用了 super（调用的是同一个方法），则继续往下查找，如果没有调用 super，则调用链会在这里断开，后续的类的方法不会被调用。
  - 如果这个类没有这个方法，则会跳过这个类，看后面的类是否有这个方法

  > 下面的例子中，调用链 D->B->C->A
  >
  >但是由于 C 中有 process 方法，但是他没有调用 super().process()，因此不会调用 A 中的 process 方法

  ```python
  class A:
    def process(self):
      print("A process")
  
  
  class B(A):
    def process(self):
      print("B process")
      super().process()
  
  
  class C(A):
    def process(self):
      print("C process")
  
  
  #   super().process()
  
  class D(B, C):
    def process(self):
      print("D process")
      super().process()
  
  
  d = D()
  print(D.mro()) # [<class '__main__.D'>, <class '__main__.B'>, <class '__main__.C'>, <class '__main__.A'>, <class 'object'>]
  d.process()
  # 输出
  '''
  D process
  B process
  C process
  '''
  ```

- property():  用来将类中的方法转为属性，让你可以通过访问属性的方式访问方法的结果，它可以通过定义 **getter**、**setter** 和 **deleter** 方法来为属性添加自定义的逻辑控制

  > 可以用来对私有属性进行封装，或者对属性的获取和修改添加逻辑处理（例如添加检验）

  > ⚠️python 中我们可以使用@property 装饰器，可以达到同样的效果，且代码更简洁，因此我们一般会使用@property

  ```python
  class Circle:
    def __init__(self, radius):
      self._radius = radius
  
    def get_radius(self):
      print("get..r")
      return self._radius
  
    def set_radius(self, value):
      print("set...")
      self._radius = value
  
    def del_radius(self):
      print("del...")
      del self._radius
  
    radius = property(get_radius, set_radius, del_radius)
  
  
  circle = Circle(6)
  print(circle.radius)
  circle.radius = 10
  
  del circle.radius
  
  ```

- vars(): 传入一个对象，则返回该对象的`__dict__`属性（若对象没有`__dict__`属性则会报错，有`__slots__`的类没有`__dict__`属性），若不传入参数，会返回当前局部作用域的变量字典，类似 locals

- zip(): 将可迭代的对象作为参数，将对象中对应的元素打包成一个个 tuple，然后返回这些 tuple 组成的对象，若各个迭代器的元素不一致，则返回的长度和最短的对象相同

  ```python
  a = [1, 2, 3]
  b = [4, 5, 6]
  c = [4, 5, 6, 7, 8]
  
  print(list(zip(a, b, c))) # [(1, 4, 4), (2, 5, 5), (3, 6, 6)]
  
  print(list(zip(*a))) # [(1, 2, 3), (4, 5, 6), (7, 8, 9)]
   
  ```

  > zip 需要传入多个参数，将对应的元素打包为一个个 tuple，而 zip(*) 是传入一个参数，相当于 zip 的逆操作，zip(*)一般会用来完成矩阵的转置

- filter

- map

- `__import__()`：用来动态加载模块，若一个模块经常变化就可以使用`__import__()`来动态加载

  ```python
  
  # fromlist 只会影响返回的结果，但是a模块中的所有的方法都是可以调用的
  a_module = __import__("a", fromlist=["Mymax"])
  
  print(a_module.__dict__)
  # 使用a模块中的方法
  print(a_module.Mymax(3, 4))
  print(a_module.Mymin(5, 8))
  
  ```

- reload（）：reload()函数在 python2.x 是内置模块，3.x 被移动到了`importlib`包下面

  **用于重新载入之前载入的模块。**

  ```python
  from importlib import reload
  time.sleep(15)
  reload(a_module)
  ```

  

### 内置的装饰器

classmethod: 将类的某个方法声明为类方法（`类方法可以直接使用类名调用`），类方法的第一个参数为类对象（cls），不是实例对象，**因此 classmethod 可以在方法内部访问类的属性或调用类的方法（静态或类方法）**

staticmethod:将类的某个方法声明为静态方法（`静态方法可以直接使用类名调用`），不需要传入 cls 和 self 参数，因此 staticmethod 不依赖于 class，适用于不需要访问类的属性和方法时。静态方法通常用于封装与类相关的辅助功能。



## 异步 IO

### 协程

协程的特点是在于一个线程执行，**和多线程相比，协程不需要线程切换，没有线程切换的开销，并且由于是一个线程执行，因此在协程中共享资源不需要加锁，因此协程的执行效率比多线程高很多**

> 协程是应用级别的一个东西，相当于是我们程序员自己去控制任务的调度

### async 和 await

使用 async 和 await 配合 `asyncio.create_task` 可以实现多个任务并行执行，类似 js 的 promise.all

```python
import asyncio
import time


async def crawl_page(time, i):
  print(f"start {i} crawl")
  await asyncio.sleep(time)
  print(f"end{i} crawl")


async def main(times):
  tasks = [asyncio.create_task(crawl_page(time, idx)) for idx, time in enumerate(times)]
  for task in tasks:
    await  task


if __name__ == '__main__':
  start_time = time.time_ns() // 1000
  asyncio.run(main([1, 2, 3, 4]))
  end_time = time.time_ns() // 1000
  print(f"执行时间为{end_time - start_time}") # 4s

```

取消任务，task.cancel()

asyncio.gather() 类似 promise.all ,可以将多个任务的结果收集起来

```python
async def worker_1():
  await asyncio.sleep(1)
  return 1


async def worker_2():
  await asyncio.sleep(2)
  1 / 0
  return 2


async def worker_3():
  await asyncio.sleep(3)
  return 3


async def main1():
  task1 = asyncio.create_task(worker_1())
  task2 = asyncio.create_task(worker_2())
  task3 = asyncio.create_task(worker_3())

  await  asyncio.sleep(2)
  task3.cancel()
  # return_exceptions=True 则不会raise 异常， 会将异常对象放入结果中
  # res =[1, ZeroDivisionError('division by zero'), CancelledError()]
  res = await asyncio.gather(task1, task2, task3, return_exceptions=True)
  print(res)


if __name__ == '__main__':
  start_time = time.time_ns() // 1000
  asyncio.run(main1())
  end_time = time.time_ns() // 1000
  print(f"执行时间为{end_time - start_time}")

```





## python 常见的内建模块

1. sys：
2. shutil：高级文件操作。例如拷贝文件，递归拷贝文件，删除文件等等
3. os: 可以对文件操作、操作环境变量
4. urllib：涉及 url 的相关操作，发请求，解析 url 地址等等
5. collections:包含 Counter、defaultdict、UserDict 等一些有用的集合工具
6. itertools： 高效创建迭代器，里面包含一些`排列组合迭代器`、groupby、filter、chain 等等
7. functools: 创建缓存来缓存函数结果、创建偏函数、reduce
8. subprocess: 允许你生成新的子进程，可以用来执行某些命令。也可以使用这个[sh](https://github.com/amoffat/sh)这个第三方库，提供了更简洁的接口
9. logging: 日志记录工具
10. datetime：处理时间和日期
11. pathlib：面向对象的文件系统路径操作
12. os.path: 常用的文件路径操作
13. copy :深拷贝和浅拷贝
14. enum ：对枚举的支持
15. tempfile：创建临时目录和文件
16. filecmp：比较文件和目录
17. glob：[`glob`](https://docs.python.org/zh-cn/3/library/glob.html#module-glob) 模块会按照 Unix shell 所使用的规则找出所有匹配特定模式的路径名称。
18. fnmatch ： Unix 文件名模式匹配，和 glob 有点类似
19. argparse：用于解析命令行参数
20. uuid：生成 uuid
21. base64:
22. mimetypes: [`mimetypes`](https://docs.python.org/zh-cn/3/library/mimetypes.html#module-mimetypes) 模块可以在文件名或 URL 和关联到文件扩展名的 MIME 类型之间执行转换
23. heapq: 优先级队列
24. fileinput：同时读取多个文件
25. abc：抽象基类，可以构建抽象类
26. operator 模块：提供了一套与 Python 的内置运算符对应的高效率函数



### 内置模块 collections

1. ChainMap:将多个 map 连接到一起，在访问键时，ChainMap 会优先返回在链中的第一个字典中的值。如果第一个字典没有该键，则继续查找下一个字典，依此类推。

   > 尤其是配置管理中，ChainMap 可以同时处理多个配置源（如本地配置、默认配置、环境变量等）

2. Counter：对可迭代的对对象计数

   ```python
   counter = Counter(['red', 'blue', 'red', 'green', 'blue', 'blue'])
   print(counter)
   
   counter.update({"red": 2})  # red:4
   
   counter.update(["red"])  # red:5
   print(counter)
   ```

3. deque:双端对列

4. defaultdict：它能够在访问不存在的键时自动为该键创建一个默认值，而不是抛出 KeyError 异常。

   ```python
   # 默认值为0
   df = defaultdict(int)
   print(df['a'])  # 0
   
   # 默认值为空数组
   df1 = defaultdict(list)
   print(df1['a'])  # []
   
   
   # 自定义默认值工厂
   def constant_factory(value):
     return lambda: value
   
   
   df2 = defaultdict(constant_factory(2))
   print(df2["a"])  # 2
   
   ```

5. UserDict：通过继承 UserDict 类，用户可以修改或扩展字典的行为。例如，重写 __getitem__、__setitem__ 等方法，以实现不同的字典操作逻辑。也可以添加额外的函数来扩展 dict 的功能

   ```python
   class CustomDict(UserDict):
   
     # 可以修改魔法方法，添加验证信息
     def __setitem__(self, key, value):
       if key == "age" and value < 18:
         raise Exception("age must >=18")
       else:
         super().__setitem__(key, value)
   
     def __setattr__(self, key, value):
       super().__setattr__(key, value)
       print(11)
   
     def increment(self, key, amount):
       if key not in self.data:
         self.data[key] = 0
   
       self.data[key] += amount
   
   
   cd = CustomDict({"name": "zwc", 'age': 19})
   print(cd)
   
   cd.increment("age1", 10)
   print(cd)
   
   ```

6. UserList、UserString：和 UserDict 的功能类似，分别是给用户来扩展 list 和 string 的

7. namedtuple：namedtuple 允许你定义一个轻量级的不可变对象（类似元组），并为每个元素赋予一个名称。它创建的类具有命名字段，能够通过字段名（而不仅仅是位置索引）访问元素

> 有点类似于 Java 的 record

```python
# 类似与java的record
Point1 = namedtuple("Point", ["x", "y"])
p = Point1(10, 20)

print(p.x)
print(p.y)
```

### fileinput 同时读取多个文件

```python
filenames = [f"modul/{name}" for name in os.listdir("modul")]

# for line in fileinput.input(files=filenames, mode='r', encoding="utf-8"):
#   print(line, end="")

"""
python  ./fileinput测试.py log.txt data.txt 
从标准输入中读取文件

还可以知道当前被读取的文件名、当前读取的行的行号，已读取的行号
"""
for line in fileinput.input():
  print(line, end="")

  print(fileinput.filename())

```



###  abc 模块

可以用来定义抽象类

```python
# 抽象类必须集成ABC类
class Animal(ABC):
  # 使用abstractmethod装饰器将一个方法变为抽象方法
  @abstractmethod
  def say(self):
    pass


class Cat(Animal):
  def hello(self):
    print("hello")

  def say(self):
    print("nihao")


cat = Cat()
cat.say()
```



### operator 模块

[`operator`](https://docs.python.org/zh-cn/3/library/operator.html#module-operator) 模块提供了一套与 Python 的内置运算符对应的高效率函数

```python
print(
  operator.add(1, 3)  # 4
)

# 与操作
print(operator.and_(3, 1))  # 1

print(operator.or_(3, 1))  # 3

```



### with 和 contextlib

#### with

某个类只要实现了`__enter__` 和`__exit__` 魔法函数就可以使用 with 语法

> open 的 with 语法就是这样的实现自动调用 close 方法的

```python
class Sample:
  def __init__(self):
    pass

  def __enter__(self):
    print("执行enter方法")

  def __exit__(self, exc_type, exc_val, exc_tb):
    print("执行exit方法")


with Sample() as sample:
  print("hello")

'''
执行enter方法
hello
执行exit方法
'''
```



#### contextlib

1. `contextlib  中的contextmanager 注解` 可以来简化上下文的管理。

> contextmanager 装饰器接收一个生成器对象，因此我们应该定义一个生成器对象

```python
from contextlib import contextmanager
@contextmanager
def getConnection(url):
  print("open conn")
  yield url
  print("close  conn")


with getConnection("hjh") as conn:
  print(conn)
```

2. `contextlib 中的closing注解`可以将一个对象变为上下文对象，这样就可以使用 with 语法了

   > closing 通常用于那些实现了 close() 方法但本身并没有实现上下文管理协议（即没有定义 __enter__ 和 __exit__ 方法）的对象。例如：
   >
   >​	•	**网络连接**：如 urllib.request.urlopen 返回的对象。
   >
   >​	•	**数据库连接**：某些自定义数据库连接类。
   >
   >​	•	**其他需要关闭的资源**：如文件流、设备接口等。

   ```python
   from contextlib import closing
   from urllib.request import urlopen
   
   with closing(urlopen("https://baidu.com")) as conn:
     print(conn)
   ```

3. redirect_stdout 、 redirect_stderr、redirect_stderr

   将标准输入/输出临时重定向到指定位置（例如：文件/字符串流）

   ```python
   from contextlib import redirect_stdout
   import io
   
   f = io.StringIO()
   
   # 将标准输出重定向到字符串流
   with redirect_stdout(f):
       print("This will go to the string stream!")
   
   print(f.getvalue())  # 输出: This will go to the string stream!
   ```

### io 模块

[`io`](https://docs.python.org/zh-cn/3/library/io.html#module-io) 模块用于处理文件操作、内存缓冲流、文本流和二进制流等，是 I/O 操作的基础模块。

```python

  f = io.BytesIO(b"some initial binary data: \x00\x01")
  print(f.getvalue())

  f3 = io.StringIO("hello")
  print(f3.getvalue())

  f3.write("hi")
  print(f3.getvalue())

  # 将流中的内容写入文件
  with open("data1.txt", "w") as file1:
    file1.write(f3.getvalue())

  with open("data.txt", "r") as f1:
    # 文本流
    print(f1)  # <_io.TextIOWrapper name='data.txt' mode='r' encoding='UTF-8'>

  # 字节流
  with open("data.txt", "rb") as f2:
    print(f2)  # 字节流


```



### argparse 模块

```python
import argparse

parser = argparse.ArgumentParser(description="一个简单程序")
parser.add_argument("--age", type=int, help="输出你的年龄", default=10)

# 只能从这三种选一个值
parser.add_argument("--color", choices=["red", "green", "blue"], required=True, help="选择一种颜色")
#  action="store_true" 只要出现了 -v /--verbose 就为true
parser.add_argument("-v", "--verbose", action="store_true", help="启动详细模式")

# 指定参数的目标名称 outputfile
# metavar: 帮助信息中自定义参数的占位符
#   -o output_file, --output output_file  输出文件

parser.add_argument("-o", "--output", dest="outputfile", metavar="output_file", help="输出文件")
args = parser.parse_args()

print(args)
```

## python 使用类型标记

```python
str1: str = "zwc"

# int | str 是联合类型
list1: List[int | str] = [1, 3, 4]
# 也可以这样使用联合类型
list2: List[Union[int, str]] = [1, 23, "zwc"]

t1: Tuple[int, str] = (3, "str")

s1: Set[bytes] = {b"z", b"a", b"a"}
dict1: Dict[str, int | str] = {"name": "zwc", "age": 18}

# 函数类型((param1:xxx)->return_type:
def process_item(d1: Dict[str, int]) -> list[str]:
  return [k for k in d1.keys()]

class Person:
  def __init__(self, name: str, age: int):
    self.name = name
    self.age = age


# Person 类型
p: Person = Person("zwc", 18)



```

`pydantic`库的使用，[pydantic](https://docs.pydantic.dev/latest/)是一个 python 做数据验证的库

```python
from pydantic import *
class Address(BaseModel):
  city: str
  zip_code: str


class User(BaseModel):
  id: int
  username: str
  age: int
  is_active: bool = True
  address: Address


try:
  user: User = User(id=1, username="zwc", age=18, is_active=False, address=Address(city="ganzhou", zip_code="342700"))
  print(user)
except ValidationError as e:
  print(e)

```





## python 中 is 和== 的区别

-  == 会调用对象的魔法函数`__eq__`方法进行判断是否相等
- is 用来判断两个对象的内存地址是否相等





## python 工程化

## 模块的导入



1. `使用相对路径导入：`在导入模块的时候使用相对路径导入，在运行 python 文件时使用`python -m cli.cli`

   ```python
   from .yolo_segment_to_labelme import yolo_segment_to_labelme
   ```

2. `使用绝对导入：`类似于下面这样.

   ```python
   from cli.yolo_segment_to_labelme import yolo_segment_to_labelme
   ```

3. 如果运行 python 文件时使用`python xxx.py` 相当于单独运行一个脚本文件

   

## python 的内存管理

### 内存分配

- 所有对象都在都在堆内存上分配
- 内存池：当创建大量消耗小内存的对象时，频繁调用 new/malloc 会导致大量的内存碎片。而内存池就是预先在内存中申请一定数量的、大小相等的内存块留作备用。有新的内存需求时，先从内存池中分配内存，不够再申请新的内存。**这样可以显著减少内存碎片，提升效率**

### 引用计数机制

通过引用计数来保存对内存中变量的追踪，即记录该对象被其他对象引用的次数

```python
import sys
e = ["a"]

f = e
# 获取某个对象的引用次数
print(sys.getrefcount(e)) # 不算getrefcount的临时引用的话，引用次数为2

```

**当引用计数为 0 时，就列入了垃圾回收队列**

> 但是遇到两个对象互相引用的时候，del 语句可以减少引用次数，但是引用计数不会归为 0，因此对象不会被销毁，从而导致的内存泄露。因此 python 引入了**标记-清除机制**

### 标记清除

```python
class Node:
    def __init__(self):
        self.next = None

a = Node()
b = Node()
a.next = b  # a 引用 b
b.next = a  # b 引用 a（循环引用）

del a
del b  # a 和 b 的引用计数始终不为 0，无法被回收

```

- 标记阶段

  - 垃圾回收器会从一组根对象（如全局变量和栈中的引用）出发，递归遍历所有可以访问的对象。
  - 所有可访问到的对象被标记为“可达”状态

- 清除阶段

  标记阶段结束之后，清除那些不可达的对象

- 标记清除是如何解决循环引用问题的？

  还是上面这个例子，在 10 和 11 行 del a ，b ，因此我们在递归遍历可访问的对象时，会发现 a，b 访问不到，因此标记阶段结束之后就会清除 a，b 对象

### 分代回收

> 分代回收是基于这样的一个统计事实，对于程序，存在一定比例的内存块的生存周期比较短；而剩下的内存块，生存周期会比较长，甚至会从程序开始一直持续到程序结束。生存期较短对象的比例通常在 80%～90%之间。 因此，简单地认为：对象存在时间越长，越可能不是垃圾，应该越少去收集。这样在执行标记-清除算法时可以有效减小遍历的对象数，从而提高垃圾回收的速度，**是一种以空间换时间的方法策略**。

python 将所有的对象分为第 0 代，第 1 代，第 2 代。新创建的对象都是第 0 代；在第 0 代的 gc 扫描中存活下来的对象会被移到第 1 代；在第 1 代的 gc 扫描存活下来的对象会被移到第 2 代

分代回收的参数阈值：

```python
import gc

print(gc.get_threshold())
# (700,10,10)

```

> 700 表示新分配的对象数量-释放的对象数量 >=700 时，第 0 代垃圾回收被触发
>
>第一个 10 表示：第 0 代 gc 扫描 10 次，第 1 代的 gc 扫描被触发
>
>第二个 10 表示：第 1 代 gc 扫描 10 次，第 2 代的 gc 扫描被触发

总体而言，python 通过内存池来减少内存碎片化，提高执行效率。主要通过引用计数来完成垃圾回收，通过标记-清除解决容器对象循环引用造成的问题，通过分代回收提高垃圾回收的效率。

参考文章：[面试必备：Python 内存管理机制](https://juejin.cn/post/6856235545220415496)





## 一些好用的 python 库

0. [PyQuickInstall](https://github.com/yhangf/PyQuickInstall): 一个命令行工具，可以快速地更换源

1. [copier](https://github.com/copier-org/copier) :可以用来快速创建项目模版
2. [hydra](https://github.com/facebookresearch/hydra):用来管理复杂应用程序的配置
3. [plotly.py](https://github.com/plotly/plotly.py): 可以创建交互式的图表
4. [pipreqs](https://github.com/bndr/pipreqs)：根据项目的 import 自动生成 requirements.txt
5. [fabric](https://github.com/fabric/fabric)：一个可以让你通过 ssh 远程执行 shell 命令的库
6. [hypothesis](https://github.com/HypothesisWorks/hypothesis)： 一个可以自动生成测试的数据的库，可以结合 pytest 和 unittest 使用，如图所示：
	 <img src="https://img.leftover.cn/img-md/202501071248157.png" alt="image-20250107124848943" style="zoom:67%;" />



7. [sh](https://github.com/amoffat/sh)： 可以很方便地执行 shell 命令