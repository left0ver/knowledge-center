

# 巨人的肩膀

[MySQL事务隔离级别：读未提交下也能避免脏读？](https://www.bilibili.com/video/BV1sM4m127n5/?spm_id_from=333.999.0.0&vd_source=3c93d521158d3aa4f74c71c5140ba8dc)

[MySQL数据库入门到大牛，mysql安装到优化，百科全书级，全网天花板](https://www.bilibili.com/video/BV1iq4y1u7vj?p=187&vd_source=3c93d521158d3aa4f74c71c5140ba8dc)

[MySQL 是怎样运行的：从根儿上理解 MySQL](https://juejin.cn/book/6844733769996304392?enter_from=search_result&utm_source=search)

[MySQL实战45讲](https://time.geekbang.org/column/intro/100020801?utm_campaign=geektime_search&utm_content=geektime_search&utm_medium=geektime_search&utm_source=geektime_search&utm_term=geektime_search)

# 字符集与比较规则

utf8 字符集表示一个字符需要使用1～4个字节，但是我们常用的一些字符使用1～3个字节就可以表示

了。而字符集表示一个字符所用的最大字节长度，在某些方面会影响系统的存储和性能，所以设计MySQL的设计者偷偷的定义了两个概念：

utf8mb3 ：阉割过的 utf8 字符集，只使用1～3个字节表示字符。

utf8mb4 ：正宗的 utf8 字符集，使用1～4个字节表示字符。

>在`MySQL`中`utf8`是`utf8mb3`的别名，所以之后在`MySQL`中提到`utf8`就意味着使用1~3个字节来表示一个字符，如果有使用4字节编码一个字符的情况，比如存储一些emoji表情什么的，那请使用`utf8mb4`。



**比较规则：**

<img src="https://img.leftover.cn/img-md/202408080118901.png" alt="image-20240808011837785" style="zoom:33%;" />

## 大小写规范

通过如下命令查看：

```java
SHOW VARIABLES LIKE '%lower_case_table_names%
```

lower_case_table_names参数值的设置：

默认为0，大小写敏感 。(Linux下的默认)

设置1，大小写不敏感。创建的表，数据库都是以小写形式存放在磁盘上，对于sql语句都是转换为小写对表和数据库进行查找。（Windows下）

设置2，创建的表和数据库依据语句上格式存放，凡是查找都是转换为小写进行。（Mac下，即存放在数据库中是区别大小写的，但是查找的时候都是转换为小写，因此也是大小写不敏感）



MySQL在Linux下数据库名、表名、列名、别名大小写规则是这样的：

1、数据库名、表名、表的别名、变量名是严格区分大小写的；

2、关键字、函数名称在 SQL 中不区分大小写；

3、列名（或字段名）与列的别名（或字段别名）在所有的情况下均是忽略大小写的；



MYSQL 在 Windows 下都是大小写不敏感的

# MYSQl 的逻辑架构

<img src="https://img.leftover.cn/img-md/202408080211479.png" alt="image-20240808021157378" style="zoom:50%;" />



# 一条SQL 的执行流程

<img src="https://img.leftover.cn/img-md/202408090132395.png" alt="98d9b2fc04143bef984bdf0726cbfd21" style="zoom: 50%;" />

大体整体流程：

1. 客户端的SQL 发送到MYSQL时，先建立连接，进行身份验证
2. 若有缓存层，则查询缓存，命中则直接返回数据，否则进行第3步
3. 解析器对SQL进行词法解析和语法解析，判断SQL的语法是否有问题，有问题则直接报错
4. 优化器则根据SQL选择合适的索引，调整表的join顺序，生成执行计划
5. 最后执行器先进行权限判断，再调用存储引擎API进行查询，返回查询的数据，若有缓存层，则将SQL和结果存入缓存中



# 缓冲池

<img src="https://img.leftover.cn/img-md/202408090309000.png" alt="image-20240809030930910" style="zoom: 67%;" />

InnoDB 存储引擎是以页为单位来管理存储空间的，我们进行的增删改查操作其实本质上都是在访问页面（包括读页面、写页面、创建新页面等操作）。而磁盘 I/O 需要消耗的时间很多，而在内存中进行操作，效率则会高很多，为了能让数据表或者索引中的数据随时被我们所用，DBMS 会申请 占用内存来作为数据缓冲池 ，在真正访问页面之前，需要把在磁盘上的页缓存到内存中的 Buffer Pool 之后才可以访问。

- 由于缓冲池大小有限，会优先将使用频次高的热数据进行加载

- 在数据库对页面进行读操作时，会判断该页面是否在缓冲池中，在缓冲池中则直接读取，不在则将数据从磁盘加载到缓冲池中再读取

- 执行更新、删除操作时，会先更新缓冲池的数据，之后再定期同步到磁盘（或者页被置换出去时会同步到磁盘）

查询缓冲池大小
```shell
show variables like 'innodb_buffer_pool_size'; # 默认128MB
```

在多线程环境下访问 buffer_pool 中的数据都需要 **加锁** 。因此单一的 buffer_pool 可能会影响速度

可以通过 `innodb_buffer_pool_instances` 来设置buffer pool 的数量

**只有在 buffer pool 的大小在 1GB 以上时生效**

```java
[server]
innodb_buffer_pool_instances = 2 // 默认为1
```



# Innodb 和 MyISAM的区别

1. Innodb 支持事务、外键、行锁、表锁，MyISAM 不支持事务、外键、只支持表锁

2. Innodb 在MYSQL 5.7开始支持全文索引，MyISAM 一直支持

3. 数据存储的位置

   - InnoDB引擎：
     - 8.0中，InnoDB引擎的 数据与索引一起保存在.ibd文件中 （独立表空间） ，数据信息和索引信息存储在 `ibdata1` （系统表空间）
     - 5.7中，.frm文件存储：表结构信息，字段长度等，`db.opt` 文件用于保存数据库等相关配置（比如字符集、比较规则），数据与索引一起保存在.ibd文件中 （独立表空间） ，数据信息和索引信息存储在 `ibdata1` （系统表空间）
   - 针对MyISAM引擎，索引信息在 .myi 文件中， 数据信息在 .myd 文件中，表结构的信息存储在 b.frm (5.7) ｜ b.xxx.sdi （8.0）

4. MyISAM 不支持崩溃后的安全恢复，而 InnoDB 有个 redolog可以支持安全恢复

5. MyISAM 引擎 buffer_pool 只缓存索引，不缓存数据，而InnoDB 引擎的buffer_pool 索引和数据都会缓存

6. MyISAM 会存储总行数，而InnoDB不存储总行数，因此 MyISAM select count（*） 很快（前提是没有查询条件） 

7. MyISAM 的主键索引与行记录是分开存储的，InnoDB的**主键索引与**行记录是存储在一起的，故叫做**聚集索引**（Clustered Index）：

   MyISAM的主键索引和普通索引没有区别：

   - 主键索引的叶子节点，存储主键，与对应行记录的`指针`
   - 普通索引的叶子结点，存储索引列，与对应行记录的`指针`

   >MyISAM中索引数据和表数据是分开存储的，因此它索引的叶子节点存储的是对应行记录的指针

   InnoDB：

   - 主键索引的叶子节点存储 索引值以及对应的行记录
   - 非主键索引的叶子节点存储 索引值以及主键

>对应的应用场景：
>
>InnoDB： 适用于需要高并发、事务处理、外键的场景，例如电商平台等
>
>MyISAM：针对数据统计有额外的常数存储。故而 count(*) 的查询效率很高，适用于只读应用或者以读为主的业务且对数据完整性要求不高的场景，例如博客平台、报表系统等



# 其他存储引擎

## Memory 引擎

Memory 是基于内存的存储引擎,数据都存放在内存中，因此当mysql关闭时数据会丢失

- 同时支持Hash索引和B+树索引（默认为Hash索引）
- 速度快，至少比 MyISAM 快一个数量级
- 数据存放在内存中，数据容易丢失

>使用场景：
>
>1. 适合临时表的场景

## **Archive** 引擎：用于数据存档

1. 只支持 `插入` 和 `查询` 两种功能（行被插入之后不能再修改）
2. 拥有很好的压缩机制，使用`zlib`压缩,同样的数据量下， 比MyISAM 表小约75% ，比 InnoDB 表小约83%

>应用场景：
>
>适合存储一些归档的数据，例如日志、档案之类的，拥有很高的插入速度，但是查询速度较慢

## CSV 引擎

1. 可以将普通CSV文件作为MYSQL的表来处理
2. 不支持索引
3. CSV储存的数据以.csv为后缀，可以直接使用excel读取

>针对数据大量的导入导出的场景，可以尝试使用CSV引擎



# 为什么InnoDB 推荐使用自增ID？

1. 因为 InnoDb 引擎存在聚簇索引，它的叶子节点存储对应的记录，是按主键的大小递增的，因此如果我们插入的 主键ID 是自增的话，这样子插入是最快的，否则如果不是按自增 ID插入的话，可能需要移动大量的行，会出现大量的页分裂，严重影响性能

# 为什么不建议使用过长的字段作为主键

因为所有的二级索引的叶子节点都会存储索引值 和 主键 ，因此如果主键过长，则二级索引会变得很大，浪费内存和磁盘

# 为什么索引可以加快查询

我把这个索引类比于图书馆的目录，如果没有这个目录，那么我们要查找某一本书，只能一本一本地找，如果有目录，那我们可以通过目录快定位到这条记录具体的位置，然后取出来就行，索引也是这样，MYSQL 中的数据是按页进行存储的，我们想要找到某条记录，需要定位到它在哪个数据页，通过索引我们可以通过几次的磁盘IO即可定位到对应的数据页，而如果没有索引，我们只能通过全表扫描，当数据量很大的时候，则需要大量的磁盘IO，而磁盘IO的速度是非常慢的。

# 为什么使用B+树而不是使用B 树或者其他数据结构建索引

1. 区别：
   - B+树的叶子节点存储具体的数据，非叶子节点只存储索引值，而B树是每个节点都会存储具体的数据，**因此，对于相同大小的索引页来说，B+树可以存储更多的索引值，因此B+树的阶数可以设置的更高，所以B+树会更加地矮胖，磁盘IO次数也更少**
   - B+树的叶子节点采用链表的形式连接，**更方便顺序遍历、范围查询、排序**；而B树的话只能采用中序遍历的方式进行范围查询和排序

>为什么不使用hash、搜索二叉树、平衡二叉树、红黑树？
>
>- hash索引只适合等值查询，不适合范围查询，不支持排序
>- 搜索二叉树在极端情况下会退化为链表，因此有了平衡二叉树
>- 平衡二叉树相比于B树来说，它每个节点只存储一个索引值，因此它的高度相比于B树来说会更高，这样的话就会增加IO的次数
>- 红黑树是一种特化的平衡二叉树，缺点和平衡二叉树类似

# 聚簇索引和非聚簇索引的结构
聚簇索引的结构

![聚簇索引结构2](https://img.leftover.cn/img-md/202408271644061.png)

二级索引结构

![二级索引结构](https://img.leftover.cn/img-md/202408271643925.png)

# 为什么要有区？

   B+树的每一层中的页会形成一个双向链表，可能逻辑上相邻的页 ，在物理上可能隔得很远。我们范围查询时只需要定位到最左边和最右边的记录，然后沿着双向链表一直扫描即可，因此可能产生大量的 `随机IO`,而随机IO是非常慢的，因此我们要尽量地让逻辑上相邻的页在物理上也相邻，这样进行范围查询的时候才可以使用`顺序IO`。

  所谓`区`就是将物理上连续的`64个页`作为一个区，页大小默认为16KB，因此一个区的大小为1MB，因此在表中数据量大的时候，为某个索引分配空间的时候就不是以页为单位分配了，而是以区为单位分配，这样可以消除很多随机IO,提升性能。

# 为什么要有段？

MySQL中有数据页和目录页，他们都是页，因此目录页和数据页可能会存放在同一个区中，这样进行范围扫描的效果就大打折扣了，因此 InnoDB 将B+树的数据页和目录页进行了区别对待，数据页和目录页不会存放在同一个区中。而存放区的集合就是 `段`，即一个段包含多个区。由于数据页和目录页存放在不同的区中，因此也有不同的段:`数据段、索引段`，数据段：存放数据页的区的集合； 索引段：存放目录页的区的集合

除此之外还有`回滚段`

段由若`干个零散的页面`以及一些完整的区组成(因为在数据量比较小的时候不会创建区，而是会使用碎片区)

# 为什么要有碎片区？

上面说到，每个表都有一个聚簇索引，每个索引都有两个段：数据段和索引段，而段是区的集合，因此按照这样算，一个表至少2个区，一个区默认为1MB，但是当我们表的数据量很小时，这样就非常浪费空间。并且每添加一个索引都需要申请2MB的空间。

针对以完整的区为单位分配给某个段对于数据量比较小的表太浪费存储空间的情况，InnoDB 提出了`碎片区`，在一个碎片区中，可能存在各种页（用于段A，用于段B，不属于任何段的页），`碎片区直属于表空间，不属于任何一个段`

>因此之后为某个段分配存储空间的策略为：
>
>- 在刚开始向表中插入数据时，段是从某个碎片区以单个页面为单位来分配存储空间的
>- 当某个段已经占用`32个碎片区`页面（32个页）之后，就会申请以完整的区为单位来分配存储空间
>
>因此段由若`干个零散的页面`以及一些完整的区组成

# 索引

## 创建索引的几种方式？

1. 在声明有主键约束、唯一性约束、外键约束的字段上会自动添加相关索引


2.使用 `create index`

```sql
create unique index on table_name(filed_name ASC|DESC)
```

3. 使用 `alter table`

   ```sql
   ALTER TABLE account
   ADD INDEX `idx_balance`(`balance` ASC|DESC) USING BTREE;
   ```

3. 创建表的时候同时创建索引
 ```sql   
   CREATE TABLE books1  (
     `id` int NOT NULL,
     `book_name` varchar(20) NULL,
     `age` int NULL,
     PRIMARY KEY (`id`),
     # 全文索引
     FULLTEXT INDEX `idx_name`(`book_name`(11)) USING BTREE,
     # 普通索引
     INDEX `idx_age`(`age` DESC) USING BTREE
   );
 ```

## 隐藏索引

在5.7版本及之前，只能通过显式的方式删除索引。此时，如果发现删除索引后出现错误，又只能通过显式创建索引的方式将删除的索引创建回来，当数据量比较大的时候，这种操作非常耗时。

MySQL8.x开始支持`隐藏索引`，即我们可以先将待删除的索引设置为隐藏索引，这样优化器将不再使用这个索引（即使使用了force index），确认系统没有影响之后，在彻底删除索引。**这种通过先将索引设置为隐藏索引，在删除索引的方式就是软删除**

>如果想验证某个索引删除之后的查询性能的影响，也可以先隐藏该索引

>注意⚠️：
>
>1. 不能将主键索引隐藏
>2. 当索引被隐藏时，它的内容仍然是和正常索引一样更新的。因此对于不需要的索引，应该将其删除

隐藏某个表的某个索引

```sql
ALTER TABLE books1 ALTER INDEX idx_name invisible;
```



## 哪些情况下适合建索引？

1. 业务上具有唯一特性的字段，即使是组合字段，也建议建成唯一索引（唯一索引的查找效率很高）

2. 频繁作为 where 条件的字段（select 、update 、delete）

   我们需要先根据where条件检索出记录，然后再对他进行update、delete。**如果进行更新的时候，更新的字段是非索引字段，提升的效率会更明显，因为非索引字段更新不需要对索引进行维护**

3. 经常 Group By 和 order By的列

4. 对用于连接的字段创建索引

   >用于连接的字段**在多张表中的类型必须一致**，虽然 mysql 可以隐式转换，但是这样就使用了函数，索引不会生效

5. 前缀索引

   为 text ，blob ，varchar 等类型的字段创建前缀索引，而不需要对全字段建立索引，根据实际文本的区分度决定索引长度

   >可以使用count (distinct left(列名，索引长度)) /count（*）的区分度来确定

```sql
SELECT  count(DISTINCT LEFT(NAME,10)) / count(*)  as sub10,count(DISTINCT LEFT(NAME,15)) / count(*) as sub15,count(DISTINCT LEFT(NAME,20)) / count(*) as sub20 from student_info
```

6. 为区分度高的列建立索引
7. 将使用频繁的列、区分度高的列放到联合索引的左侧

## 索引不是越多越好

1. 每个索引都需要占用磁盘空间，索引越多，占用的磁盘空间就越大
2. 索引会影响 insert、delete、update 等语句的性能，因为如果更新了表的建立了索引相关的字段，索引也要进行调整
3. 优化器在生成执行计划时，会针对每个可以用到的索引进行评估，以生成一个最好的执行计划，如果同时有很多个索引都可以用于查询，那么会增加 MySQL 优化器生成执行计划的时间

## 哪些情况下不适合建索引？

1. 数据量小的表不适合建立索引（<1000行）
2. 区分度低的列不建索引
3. where条件中使用不到的不建索引
4. 频繁更新的字段`不一定`要创建索引，避免对经常更新的表`创建过多的索引`
5. **不建议使用无序的值作为主键**（例如 身份证，UUID，MD5，hash，无序长字符串），插入可能造成大量的页分裂

## 索引失效的情况

1. 最左匹配原则

2. where条件中的字段使用了函数、计算、类型转换（隐式或者显示）都会导致索引失效

3. 范围条件右边的列失效

   例如下面的情况，由于classid是范围查询，因此后面的name字段就没有用到索引，只有age 和 classid 字段使用上了索引

   ```sql
   create index idx_age_name_classid on student(age,classid,name);
   EXPLAIN SELECT SQL_NO_CACHE * FROM student WHERE student.age=30 AND student.name ='abc' AND student.classId>20;
   ```

   >实际中金额查询，日期查询往往都是范围的，因此在对此类字段创建索引时，我们可以将`范围查询的字段放到联合索引的最后面`

4. ！= 的条件可能会使索引失效

   ```sql
   EXPLAIN SELECT SQL_NO_CACHE * FROM student WHERE name <> '123';
   ```

   因为！=即使走索引，其效率太慢了，因此还不如直接全表扫描

5. is null 可以走索引，is not null 无法使用索引

   >原因和第四点类似， 同理 not like 也无法走索引

   ```sql
   EXPLAIN SELECT * FROM student WHERE age is not null 
   ```

6. like 以通配符 % 开头，索引失效

   即如果是 `%xxx` ,则索引失效，只有 % 不在第一个位置时，索引才会起作用

   ```sql
   # 索引不起作用
   EXPLAIN SELECT * FROM student WHERE name like '%ab'
   # 索引起作用
   EXPLAIN SELECT * FROM student WHERE name like 'a%b'
   ```

7. or 前后存在非索引的列，索引失效

   只有 or 前后的列都创建了索引时，才会使用索引（可能会使用2个索引）

   >例如下面的例子：由于 or 是表示前后符合条件的都要，因此只有一个有索引，另一个没有索引的话，另一个字段还是要全表扫描，因此不如走直接全表扫描

   ```sql
   CREATE INDEX idx_age ON student(age)
   # 不会走索引
   EXPLAIN SELECT * FROM student WHERE age = 10 OR classid =100
   ```



# join 连接查询的优化

对于下面这条连接操作的SQL，执行步骤：

1. 从表 type 中读入一行数据 R；
2. 从数据行R中，取出 card 字段到表 book 里去查找；
3. 取出表 book 中满足条件的行，跟R组成一行，作为结果集的一部分；
4. 重复执行步骤1到3，直到表t1的末尾循环结束。

```sql
 SELECT SQL_NO_CACHE * FROM `type` LEFT JOIN book ON type.card = book.card;
```

1. 对于内连接来说，**若只有一个表有索引，则优化器会选择有索引的那个表作为被驱动表**，**若两个表都有索引，则小表作为驱动表，大表作为被驱动表**

## 原理

### Nested-Loop Join

就是比较简单粗暴的一种方式：

1. 从表 type 中读入一行数据 R；
2. 从数据行R中，取出 card 字段到表 book 里去查找；
3. 取出表 book 中满足条件的行，跟R组成一行，作为结果集的一部分；
4. 重复执行步骤1到3，直到表t1的末尾循环结束。

### Index Nested-Loop Join

相比于 Nested-Loop Join 来说，这种方式的优化在**于给被驱动表加上了索引**，因此被驱动表不需要每次都全表扫描，使用了索引可以大大加快 join 的速度

### Block Nested-Loop Join

上面第一种 Nested-Loop Join 中，对于驱动表的每一行数据，都需要访问一次`被驱动表`, 每一次被驱动表的访问都需要将被驱动表从硬盘读取到内存，IO大代价很大。因此 Block Nested-Loop Join 就是来减少这种 IO 次数的。

在 Nested-Loop Join 中，被驱动表每次加载到内存中，只会与 驱动表的一条记录做匹配，然后再从驱动表中取出下一条记录，再将被驱动表加载到内存，周而复始。

在 Block Nested-Loop Join 的设计中，提出了一个 `join buffer`的概念(可以通过 `join_buffer_size` 配置，默认大小为256kb)，将若干 `驱动表` 的数据加载到 `join buffer` 中，然后扫描被驱动表，每一条被驱动表的记录`一次性`和join buffer 中的驱动表的记录做匹配，这样可以显著减少被驱动表的IO次数（被驱动表的IO次数 = 驱动表加载到`join buffer`中的次数，若join buffer足够大，甚至可以1次即可）

<img src="https://img.leftover.cn/img-md/202408162003655.png" alt="image-20240816200324533" style="zoom: 25%;" />

>整体性能  Index Nested-Loop Join >  Block Nested-Loop Join > Nested-Loop Join



### Hash join

MySQL 的8.0.20开始废弃 Block Nested-Loop Join ，在8.0.18版本中引入了hash join，并且默认会使用hash join

>好像很多人都说只能用于等值连接的情况，但是我测试下来，非等值连接的情况也能使用hash join

1. 使用一个较小的表并基于连接条件构建一个hash table（key为条件列，value 为行数据）
2. 扫描被驱动表，对每行数据的连接条件的列进行hash，查看在hash table 中是否存在对应的数据，如果存在，合并两个表的行数据

## join 的优化手段

1. 小表驱动大表
2. 为被驱动表添加索引，驱动表最好也能添加索引
3. 增加join buffer 的大小
4. 减少不必要的字段查询，避免select *

# 子查询的优化

子查询是 MySQL 的一项重要的功能，可以帮助我们通过一个 SQL 语句实现比较复杂的查询。但是，子查询的执行效率不高。原因：

1. 执行子查询时，MySQL需要为内层查询语句的查询结果 `建立一个临时表` ，然后外层查询语句从临时表中查询记录。查询完毕后，再撤销这些临时表 。这样会消耗过多的CPU和IO资源，产生大量的慢查询。

2. 子查询的结果集存储的临时表，`不论是内存临时表还是磁盘临时表都不会存在索引` ，所以查询性能会受到一定的影响。

3. 对于返回结果集比较大的子查询，其对查询性能的影响也就越大。

在 MySQL 中，可以使用连接（JOIN）查询来替代子查询。连接查询不需要建立临时表 ，其速度比子查询要快 ，如果查询中使用索引的话，性能就会更好。

# 排序查询的优化

为排序字段建立索引，避免使用`file sort` （当然不是使用了file sort 就慢），不过还是要尽量避免file sort（尤其是没有where子句做筛选时）

## 排序的原理

<img src="https://img.leftover.cn/img-md/202408182107389.png" alt="image-20240818210715275" style="zoom:50%;" />

>双路排序相对更慢，但是不需要很大的 sort_buffer ，而单路排序则更快，但是需要更大的 sort_buffer(是一种空间换时间的思想)

```sql
# InnoDB 对应的排序缓冲区的大小为1M ，MyISAM的为8M
show VARIABLES like '%sort_buffer_size'

```

<img src="https://img.leftover.cn/img-md/202408170321230.png" alt="image-20240817032132171" style="zoom:50%;" />

当一行的数据 > `max_length_for_sort_data`(默认4096) 字节时，使用单路排序，否则使用双路排序（因此尽量只 select 必要的字段）



## 总结

1. 为order by 字段建立索引
2. 提高`sort_buffer`的容量,也可以适当提高 `max_length_for_sort_data` 的值
3. 只查询必要的字段

# 分页查询的优化

```sql
select * from student limit 200000 ,10 # 65ms
```

## 优化思路1

在索引上完成排序分页的操作，最后根据主键关联回原表查询所需要的其他列内容

```sql
# 可以将上面的 SQL 这样改写
SELECT * FROM student s ,(SELECT id FROM student ORDER BY id limit 200000,10) a  WHERE s.id =a.id # 40ms
```

## 优化思路2

该方案适用于主键自增的情况,局限性比较大（但是性能不错）

```sql
# 可以将上面的 SQL 这样改写
select * from student where id > 200000 limit 10;
```

# Exist 和 In 的区别

exist 和 in 都用于子查询 ， exist 用于检查子查询是否返回结果集，返回boolean； in 用于检查某个值是否在子查询中。

二者的执行机制有所区别，应用场景也不相同。

```sql
# 这两条 SQL 的作用相同
select * from A where cc in(select cc from B)

select * from A where exist (select cc from B where B.cc = A.cc)
```

- exist：先遍历 A 表，B表中查询是否有等于A表中的cc字段的值（适用于A表比较小，B表比较大的场景且B表有索引的场景）
- in： 先执行B表子查询的语句，再select A 表（适用于B表比较小，A表比较大的场景，且A表有索引的场景）

# count（*） ，count（1），count（字段）的区别

1. count（*） 和 count（1）的性能基本一致，没区别。**如果是查询整个表的数据行，MyISAM引擎中每个表有一个 row_count 字段，存储表的总行数，因此时间复杂度为O（1），而InnoDB则需要全表扫描. 若有where子句，则都会全表扫描**
2. count（字段）来统计行数，尽量采用二级索引。**因为主键采用的是聚簇索引，聚簇索引包含整个记录的信息，大小比二级索引大得多。**
3. 对于count(*) 和 count（1）来说，他们只需要统计行数即可，因此系统会**自动采取占用空间更小的二级索引**来统计（根据key_len来判断），当没有二级索引，才会采用主键索引来进行统计

# MySQL的自增ID的问题

1. 使用自增ID容易被猜测到对应的主键id以及总的用户量。很容易通过接口进行数据的爬取
2. 自增ID性能较差，需要在数据库端生成，而数据库往往就是系统的瓶颈
3. 自增ID不适应于分布式的场景，只在当前数据库实例中唯一

# 传统的 UUID 以及 UUID_SHORT函数

传统的uuid的特点如下图所示，其特点为：

- 不是递增的
- 全球唯一
- 字符串类型，长度太大，需要36B，32个B存储对应的信息，4B存储`-`

<img src="https://img.leftover.cn/img-md/202408180049471.png" alt="image-20240818004916358" style="zoom: 50%;" />

UUID_SHORT 函数：

- 返回的是一个64位的无符号整数，且是递增的（只需要8B即可存储）
- 适用于分布式环境，依赖于MySQL服务器的`server_id`变量来生成唯一的标识符

>1. 依赖于MySQL的server_id，因此mysql集群的的server_id 要不同，否则可能导致id重复
>2. 依赖于Mysql服务器的时间，若服务器时间不同步可能会导致id重复



# change buffer

在buffer pool 中有一块的内存空间是留给change buffer当使用的，可以通过`innodb_change_buffer_max_size`参数调整 change buffer 占用 buffer pool的大小（默认为25%）

前提id为主键，建立了一个name的二级索引（非唯一），执行`update table set name = 'zwc' where id =1`这条SQL

- 首先会根据聚簇索引找到对应的记录，然后更新聚簇索引中这条记录对应的name字段的值
- 由于name字段建立了二级索引，我们还需要更新对应的二级索引的值，甚至可能还需要移动对应的索引（对索引重新排序），这时候若对应的二级索引页不在buffer pool中
  - 无change buffer：读取对应的索引页到 buffer pool中，进行更改，重新排序，最后写回磁盘
  - 有change buffer：将更新操作缓存到 chang buffer 中，当下次对应的索引页加载到了buffer pool中时，此时会应用上change buffer 中的更该，写回磁盘，从而保证数据的一致性（这种方式可以减少磁盘IO的次数）

>change buffer **不适应**于`聚簇索引`、`唯一索引`，因为唯一索引在进行更改的时候需要进行唯一性的检查，出现了相同的 value 时要及时报错，因此唯一索引不能使用change buffer。

**写回磁盘的时机：**

- select时将对应的二级索引页读取到buffer pool中时
- 服务器比较空闲时
- 数据库正常关闭时

**change buffer在insert 、update、delete比较多的场景中表现会更明显，若写操作很少时，可以禁用chang buffer，从而提高buffer pool的空间**

# 事务

## 事务的四个特性

A（Atomicity）：原子性是指事务是一个不可分割的工作单位，要么全部成功，要么全部失败。(`undo log 来保证`)

C（Consistency）：一致性是指事务执行前后，数据从一个 合法性状态 变换到另外一个 合法性状态（事务开始前后，数据库的完整性没有被破坏）

I（Isolation）：隔离性：一个事务的执行不能被其他事务干扰，即一个事务内部的操作及使用的数据对 并发 的其他事务是隔离的，并发执行的各个事务之间不能互相干扰(`由锁和MVCC来实现`)

D（Durability）：持久性：事务一旦提交，对数据库的改变就是永久性的，不能被撤回（`由redo log 来保证`）

## 显式事务和隐式事务

### 显式事务

使用`begin` 或者 `START TRANSACTION` 关键字来开启一个事务。不过`START TRANSACTION` 后面可以跟随修饰符（不跟随的话默认为READ WRITE）

- READ ONLY: 只读事务

  >只读事务可以对临时表进行修改

- READ WRITE：读写事务（默认）

- WITH CONSISTENT SNAPSHOT：启动一致性读

```sql
# 一个事务要么是只读事务，要么是读写事务，不能同时具有
START TRANSACTION READ WRITE, WITH CONSISTENT SNAPSHOT;
```

### 隐式事务

MySQL默认是`自动commit的`，若我们没有使用`begin` 或者 `START TRANSACTION` 关键字来开启一个事务的话，执行DML语句时会自动提交，相当于一条DML语句就是一个事务

```sql
show VARIABLES like 'autocommit'
```

若关闭了自动提交，则需要显式地使用commit来提交



### 保存点(SAVEPOINT)

```sql
BEGIN;
UPDATE student set name ='zwc' WHERE id =1;
# 创建一个保存点
SAVEPOINT s1;
UPDATE student set name ='zwc2' WHERE id =2;
SELECT * FROM student;
# 回滚到s1
ROLLBACK TO s1;
COMMIT;
```

```sql
# 删除保存点
RELEASE SAVEPOINT 保存点名称;
```

### completion_type参数

```sql
# 默认为 NO_CHAIN
show VARIABLES like 'completion_type' 
```

<img src="https://img.leftover.cn/img-md/202408182351640.png" alt="image-20240818235120535" style="zoom:50%;" />



## 三大读问题

脏读：事务A读取了`已经事务B更新了还没有提交`的记录(因为事务B还没commit，因此他可能rollback，所以事务A读取的是脏数据)

<img src="https://img.leftover.cn/img-md/202408191424286.png" alt="image-20240819142431212" style="zoom:50%;" />



不可重复读：事务A两次执行相同的查询操作，得到的结果不一样（在两次查询操作之间，事务B对表中的记录进行了修改，并且commit了）

<img src="https://img.leftover.cn/img-md/202408191422466.png" alt="image-20240819142230370" style="zoom:50%;" />

幻读：事务 A 根据条件查询得到了 N 条数据，但此时事务 B 删除或者增加了 M 条符合事务 A 查询条件的数据并且 commit 了，这样当事务 A 再次进行查询的时候真实的数据集已经发生了变化，但是A却查询不出来这种变化，因此产生了幻读。

```sql
#事务 A              																					事务B
begin;							
																															begin;
select count(*) from student1 where id =8; #0
																															insert into student1 values(8,'zwc8');
																															commit;
insert into student1 values (8,'zwc888');#此时插入不进去，已经存在id=8的记录了
commit;
```



## 四个隔离级别

1. 查看和设置隔离级别

   ```sql
   # 查看隔离级别
   # mysql 5.7
   SHOW VARIABLES LIKE 'tx_isolation';
   # mysql8
   SHOW VARIABLES LIKE 'transaction_isolation';
   
   # 设置隔离级别
   # 0：Read—Uncommited
   # 1：RC
   # 2: RR
   # 3: SERIALIZABLE
   set [global｜ session] TRANSACTION_ISOLATION  = 2; 
   
   # 隔离级别的格式为
   #READ UNCOMMITTED
   #READ COMMITTED
   #REPEATABLE READ
   #SERIALIZABLE
   set [global｜ session] TRANSACTION ISOLATION level READ COMMITTED ;
   
   ```


## redo log

事务要想保证`持久性`，比较简单粗暴的方法

- 每次事务提交之前，将对应修改的数据写回磁盘

  >mysql中是以页为单位来修改数据的，有时候可能我们只修改了一条记录的某个字段，如果每次事务提交之前都将修改之后的数据写回磁盘的话，会产生大量的IO，影响性能

### redo log的整体流程？



<img src="https://img.leftover.cn/img-md/202408191813391.png" alt="image-20240819181329332" style="zoom:50%;" />



1. 将数据库的记录读取到内存，修改内存中对应的数据

2. 将变更生成一条redo log 写入 redo log buffer（内存缓冲区）

   >记录页的修改操作，例如 xx页，yyyy偏移量，写入的具体数据 data

3. 根据`innodb_flush_log_at_trx_commit`变量的值，来决定什么时候将redo log buffer 的内容写入 redo log file（磁盘文件），采用的是追加写入的方式

   >默认是commit之前会写入  redo log file文件中

4. 定期将内存中修改的数据一次新刷新到磁盘中

### redo log 为什么可以保证持久性？

1. 如果事务commit之前数据库宕机了，这时候就会回到事务开始之前到状态（很合理，毕竟你的事务还没commit）

2. 事务commit 之后宕机了，此时内存中buffer pool中的的数据就没了，redo log buffer中的内容也没了，但是由于提交之前我们已经将 redo log buffer 的内容写入了 redo log file，因此我们可以根据 redo log file 进行重放即可保证事务的持久性。

   >能否保证持久性也跟 innodb_flush_log_at_trx_commit 变量的值有关，这个变量决定了什么时候将 redo log buffer 的内容写入 redo log file（默认值是可以保证持久性的）

### innodb_flush_log_at_trx_commit

innodb_flush_log_at_trx_commit参数控制什么时候将redo log buffer中的内容写入redo log file

**性能：0>2>1**

- 0: 每次事务提交时不会进行刷盘操作（主线程每隔1s进行一次刷盘操作）

  >若事务commmit之后数据库挂了，后台没有及时将redo log buffer 中的内容写入 redo log file，那么该事务对数据页的修改会丢失

- 1（默认值）：事务commit时将redo log buffer中的内容写入 redo log file，**可以保证事务的持久性**

- 2:事务提交时将redo log buffer的内容写入`操作系统的文件缓冲区`，并没有真正写入磁盘，由操作系统决定什么时候写入redo log file

  >若事务commit之后数据库挂了，操作系统没挂，还是可以保证事务的`持久性`，但是操作系统挂了的话就不能保证事务的`持久性`了



## undo log

### 什么是undo log？

undo log 可以用于数据库的`回滚`，来保证事务的`原子性` 和 `实现 MVCC`

- insert 操作的undo log，会记录`记录的主键值`，回滚时只需要把根据主键把记录删除即可
- delete一条记录时，`要把这条记录的内容都记录下来`，之后回滚的时候再把由这些内容的记录`插入回表`中即可
- update一条记录时，将被更新列的`旧值`记下来，回滚的时候将这些列`更新为旧值`即可

>- select 操作不会修改用户记录，不会记录undo log
>- 使用redo log 进行重放的时候，也会记录undo log

### undo log 如何进行回滚？

1. 根据行记录中的 `roll_pointer` 指针,找到这条行记录对应的undo log的位置，根据 undo log 来进行回滚，再根据这条undo log 的`old_roll_pointer` 字段来找到版本链中的上一个undo log（每条行记录对应的undo log 会放在同一个`版本链`中）根据`trx_id`来判断是否需要回滚（只回滚当前事务的开始状态）

### 整体流程

在每次执行sql之前会记录 undo log ，执行玩sql 之后记录redo log

<img src="https://img.leftover.cn/img-md/202408220031610.png" alt="image-20240822003122394" style="zoom:50%;" />

>undo log 是如何刷盘（持久化到磁盘）的？
>
>undo log 和数据页的刷盘策略是一样的，都需要通过 redo log 保证持久化。
>
>buffer pool 中有 undo 页，对 undo 页的修改也都会记录到 redo log。数据页和 undo 页都是靠这个机制保证持久化的。

## 锁

### 共享锁(S锁) vs 排他锁（X锁）

- 对某条记录加了S锁之后，`还可以加S锁，不可以加X锁，否则会被阻塞`
- 对某条记录加了X锁之后，`不可以加X锁和S锁，否则会被阻塞`

>S锁和X锁互斥 ； X锁与X锁、S锁都互斥

**如何加S锁和X锁:**

```sql
# 对读取的记录加S锁
select * from student1 where id =2 lock in  share mode;
# 8.0新增语法
select * from student1 where id =2 for share;

# 对读取的记录加X锁
select * from student1 where id =2 for update;
```

**8.0新特性：**

在5.7及其之前的版本，select … for update,若获取不到锁则会被阻塞，直到超时（超时时间：`innodb_lock_wait_timeout`）。

8.0中 select … for update ，select … fro share 添加了 `nowait` 、`skip locked`语法

- nowait：不会阻塞，会立刻报错返回
- skip locked：只返回结果中不包含被锁定的行

```sql
# nowait
SELECT * FROM student1 WHERE id =2 FOR UPDATE nowait;
# skip locked
SELECT * FROM student1  FOR UPDATE skip locked;
```



### 表锁

#### 表级S锁和X锁

在进行CRUD是，innodb是使用的行锁，只有对某个表执行一些DDL（alter table, drop table）语句时，会添加元数据锁（表锁）

我们也可以显式地使用表级锁：

>一般情况不会使用表锁，只有在一些特殊情况，例如`崩溃恢复`过程中用到

```sql
# 给某个表加读锁
LOCK TABLES student1 read;
# 给某个表加写锁
LOCK TABLES student1 write;
# 查看哪些表加了表锁
show open tables WHERE in_use >0;
# 解锁
UNLOCK tables;
```

<img src="https://img.leftover.cn/img-md/202408221602060.png" alt="image-20240822160213929" style="zoom: 50%;" />

#### 意向锁

意向锁也是一种表锁，`它不与行级锁冲突`,分2种意向锁

- 意向共享锁（IS锁）：事务有意向对表中的某些行添加S锁,事务想要为某些行添加S锁，需要在数据表上添加IS锁

- 意向排他锁（IX锁）：事务有意向对表中的某些行添加X锁。事务想要获取数据表中某些记录的X锁，需要在数据表上添加IX锁

**这时，意向锁会告诉其他事务已经有人锁定了表中的某些记录**

>意向锁是由存储引擎自己维护的 ，用户无法手动操作意向锁，`在为数据行加S / X锁之前，InooDB 会先获取该数据行所在数据表的对应意向锁`

##### 意向锁解决了什么问题？

如果我们为某一行数据添加了X锁，MySQL会自动给更大一级的空间（例如数据页/数据表）添加意向锁，**告诉其他人这个数据页/数据表有人给他上了排他锁**。

当我们为表A中的某个记录添加了X锁，之后其他事务需要添加一个表锁，

- 无意向锁的情况：我们需要遍历整个表的所有记录行，查看是否有记录添加了S锁/X锁
- 有意向锁的情况：在我们为某个记录添加了X锁的同时，MySQL会自动地为这个表添加IX锁，之后我们需要添加表级X锁，我们就只需要判断这个表有没有IS锁/IX锁，若有，则阻塞，否则则可以直接加锁。

##### 作用

- 协调行锁和表锁的关系，以便同时支持行锁和表锁，避免表锁需要一行一行地判断记录是否加了S锁/X锁

|      | IS   | IX   |
| ---- | ---- | ---- |
| IS   | 兼容 | 兼容 |
| IX   | 兼容 | 兼容 |

|         | IS   | IX   |
| ------- | ---- | ---- |
| 表级S锁 | 兼容 | 互斥 |
| 表级X锁 | 互斥 | 互斥 |



#### 自增锁（了解）

我们为某个列添加了`AUTO_INCREMENT` ,在插入时，可以不需要指定值，mysql会自动生成。而`自增锁`就是用于 `AUTO_INCREMENT`自动生成值的场景

1. 插入的3种模式：

   <img src="https://img.leftover.cn/img-md/202408221752165.png" alt="image-20240822175236042" style="zoom: 50%;" />

   >简单插入：可以预先确定要插入的行数
   >
   >批量插入：不确定要插入的行数
   >
   >混合模式插入：是simple insert 的语句，但是只需要指定部分新行的自动递增值 [MYSQL高级.md](MYSQL高级.md) 

2. innodb_autoinc_lock_mode的三种取值，对应3种不同的锁模式：

   <img src="https://img.leftover.cn/img-md/202408221758801.png" alt="image-20240822175814724" style="zoom: 80%;" />

#### 元数据锁（MDL锁）

MDL锁用于确保读写的正确性。

- 防止在crud期间进行`表结构变更`
- 防止在进行表结构变更的时候执行crud的语句

原理：在对一个表进行crud时，会给表加上`MDL读锁`,当要对表结构进行变更操作时，加`MDL写锁`(读读可以并发，读写、写写不可以并发)





### 行锁

#### 记录锁

平常加的X锁和S锁，就是记录锁，即锁住整条记录，如下：

```sql
# 对读取的记录加S锁
select * from student1 where id =2 lock in  share mode;
# 8.0新增语法
select * from student1 where id =2 for share;

# 对读取的记录加X锁
select * from student1 where id =2 for update;
```

>notice:
>
>**select … fro update 语句执行过程中所有扫描的行都会被锁上，因此MySQL中使用X锁，S锁时，必须确定使用了索引，而不是全表扫描，否则会锁住整个表**

```sql
# 事务1																								#事务2
begin;
																											begin;
select * from student where name ='zwc6';	#name字段没有索引，因此锁住了整个表
																											select * from student where id =2;#由于被锁住了整个表，因此这条sql会被block
```



#### 间隙锁

1. **间隙锁是为了防止插入幻影记录而提出的。**
2. MySQL在RR隔离级别可以解决大部分的幻读，解决方案有2种：一种为MVCC，一种为采用加锁的方式（使用间隙锁，防止幻影记录的产生）

>虽然有共享间隙锁和独占间隙锁之分，但是他们的作用相同

对于这样一个表，我们在一个事务中执行下面的sql加上间隙锁，在另一个事务中执行insert操作，只要插入记录的id在(6,19)之间，就会被阻塞

<img src="https://img.leftover.cn/img-md/202408222310570.png" alt="image-20240822231057467" style="zoom:33%;" />

```sql
select * from student where id =11 for share; # 加共享间隙锁,锁住的是6-19这个区间
select * from student where id =11 for update # 加独占间隙锁

select * from student where id < 19 for update; # 锁住的是<19的所有间隙
select * from student where id <= 19  and id >6 for update; # 使用的是临键锁，锁住的是(6,19]
```

#### 临键锁

`临键锁`本质就是`记录锁` + `间隙锁`，既能保护这条记录，又能防止别的事务将新纪录插入被保护记录的前边的间隙中

>Innodb在`RR的隔离级别`默认使用的是临键锁，因此我们前面间隙锁和记录锁测试才能成功

```sql
begin;
# 使用间隙锁
select * from student where id <= 19 and id >6 for update;
```



#### 插入意向锁

一个事务在插入一条记录的时候，需要判断插入位置是否已被其他事务加了间隙锁（next-key lock 也包含间隙锁）。如果有的话，插入操作就会发生**阻塞**，直到拥有间隙锁的那个事务提交为止（释放间隙锁的时刻），在此期间会生成一个**插入意向锁**，表明有事务想在某个区间插入新记录，但是现在在等待。

如果说间隙锁锁住的是一个区间，那么插入意向锁 锁住的就是一个点

- 插入意向锁不是意向锁，而是一种`特殊的间隙锁`
- 插入意向锁之间`互不排斥`，及时多个事务在同一区间插入多条记录，只要记录本身（id，唯一索引）不冲突，那么事物之间就不会出现冲突等待。

### 隐式锁

隐式锁不需要显式地编写锁定关键词，会自动加锁或解锁。 例如在未提交的事务中插入数据，就是通过隐式锁的方式避免其它事务对插入数据的读写，如果能读到了那就是脏读，如果能写那就是脏写。 隐式锁是一种延时加载的方式，在多个事务的情况下，在第二个事务访问时，才会被动地加锁，这样可以减少锁的数量。

```sql
#事务1                     														# 事务2
begin;	
																								begin;
insert into student values(8,'zwc8');									
																							  select * from student where id =8 for update;#尝试对id=8这条记录加X锁，被阻塞
```

被阻塞时，在会话3中执行下面的sql可以看到隐式锁记录
```sql
SELECT * FROM performance_schema.data_lock_waits;
```

###  全局锁

全局锁就是对`整个数据库`加锁，需要让整个库处于`只读状态`的时候，可以使用这个命令.比较典型的场景：`全库逻辑备份`

全局锁命令：

```sql
flush tables with read lock;
```

### 锁监控

查看锁的争夺情况，是一个汇总的信息：

```sql
show STATUS like '%innodb_row_lock%'
```

<img src="https://img.leftover.cn/img-md/202408240020143.png" alt="image-20240824002039026" style="zoom:33%;" />

其他的一些查看锁的相关信息的方法：

```sql
# 查看事务的一些详细的信息
SELECT * FROM information_schema.INNODB_TRX;

# 查看所有的锁的情况（锁的id，锁类型，锁的状态）
# mysql 8
SELECT * FROM `performance_schema`.data_locks;
#mysql 5.7及其之前(只能查看阻塞的事务的锁)
SELECT * FROM information_schema.innodb_locks;

# 查看正在阻塞的锁的具体情况（阻塞的锁id，阻塞的锁的线程id等等）
# mysql 8
SELECT * FROM performance_schema.data_lock_waits;
#mysql 5.7及其之前
SELECT * FROM information_schema.innodb_lock_waits
```

## MVCC

### 什么是MVCC

所谓MVCC（Mutil Version Concurrency Control），就是生成一个`ReadView`,通过 ReadView 找到符合条件的版本记录（历史版本由undo log 构建）。`对于读操作`：只能读到生成ReadView之前`已提交事务所做的更改`，在`生成ReadView之前的事务或者之后开启的事务`所做的更改是看不到的。`对于写操作：`写操作针对的是最新版本的记录，是当前读，加锁实现。

MVCC 主要是用来提高数据库的并发性能，用更好的方式去处理`读写冲突`，做到即使有读写冲突时，`也能做到不加锁，非阻塞并发读`

>MVCC = 隐藏字段+ undo log 版本链 + ReadView

### 快照读 vs 当前读

#### 快照读

快照读又叫一致性读，读取的是快照数据（读到的数据并不一定是数据的最新版本，而有可能是之前的历史版本）。**不加锁的简单select 都属于快照读，即不加锁的非阻塞读。**

快照读的前提是隔离级别不是`串行化`，**串行化级别下的快照读会退化为当前读。**

#### 当前读

当前读读取的是记录的最新版本，读取是还要保证其他并发事务不能修改当前记录，会对读取的记录加锁。**update、delete、insert和加锁的select都是当前读**

```sql
select * from table lock in share mode;# s锁
select * from table for update; # X锁
insert into table values(...) # X锁
delete * from table where ...# X锁
update table set key = value # X锁
```

### 整体的设计思路

undo log 版本链中存储了这一条记录之前的版本，可以通过roll_pointer来找到之前的版本，有很多个之前的版本，而ReadView就是用来确定我们要读的是哪个版本。

- **在RC隔离级别下，每次执行select 操作都会生成一份ReadView**
- **而在RR隔离级别下，只有第一次select操作会生成ReadView，之后的select会复用之前的ReadView，从而保证了可重复读**



### ReadView 和ReadView的规则

Readview中有4个比较重要的字段：

- `m_ids`: 生成ReadView时系统中**所有活跃的读写事务的的id列表**（活跃的事务id列表）
- `min_trx_id`: 活跃的事务id列表中的最小的事务id（即m_ids中的最小事务id）
- `max_trx_id`:生成ReadView时系统中`应该分配给下一个事务的id值`(系统中的最大事务id+1)
- `creator_trx_id`: 生成该ReadView的事务的事务id

上面我们说到，ReadView就是用来确定我们要读的是哪个历史版本，其具体的规则如下：

- 被访问版本的trx_id和ReadView中的 `creator_trx_id` 值相同，表示当前事务在访问它自己修改过的记录，当前事务是可以看到它自己修改过的记录，因此该版本`可以`被当前事务访问
- 被访问版本的trx_id < ReadView 中的 `min_trx_id`，表示生成该版本的事务在当前ReadView生成之前已经commit,因此该版本`可以`被当前事务访问
- 被访问版本的trx_id >= ReadView 中的 `max_trx_id`，表示**生成该版本的事务在当前ReadView生成之后才开启**，因此该版本`不可以`被当前事务访问
- 被访问版本的trx_id 处于 [`min_trx_id`,`max_trx_id`) ,需要判断trx_id是否在m_ids中
  - 如果在，说明创建ReadView时生成该版本的事务还是活跃的（没有commit），该版本`不可以`被访问
  - 如果不在，说明创建ReadView时生成该版本的事务已经被commit，该版本`可以`被访问



###  RC隔离级别下

这部分需要画图才能更好地理解。详情请看[READ COMMITTED —— 每次读取数据前都生成一个ReadView](https://relph1119.github.io/mysql-learning-notes/#/mysql/24-一条记录的多幅面孔-事务的隔离级别与MVCC?id=read-committed-每次读取数据前都生成一个readview)



### RR 隔离级别下

详情请看[REPEATABLE READ —— 在第一次读取数据时生成一个ReadView](https://relph1119.github.io/mysql-learning-notes/#/mysql/24-一条记录的多幅面孔-事务的隔离级别与MVCC?id=repeatable-read-在第一次读取数据时生成一个readview)



### 为什么说 RR 隔离级别解决了大部分的幻读

RR隔离级别下，对于当前读会加临键锁（记录锁+间隙锁），通过间隙锁来保证别的事务不会插入记录，从而解决了幻读；对于快照读，通过MVCC复用同一个ReadView解决了大部分的幻读，**还是有小部分的幻读没有被解决**，我已经对下面的结果进行了测试，读者可以自己测试一下。

场景1:

```sql
# 事务A																													# 事务B
begin;
																															begin;
select * from student where id>8;
																														insert into student values(9,'zwc9',18);
																														commit;
# 这里使用当前读，不会使用MVCC，读取的是最新的数据，因此这里能读取到事务B插入的数据。
select * from student where id > 8 lock in share mode;
```

场景2:

```sql
# 事务A																													# 事务B
begin;
																															begin;
select * from student where id>8;
																															insert into student values(10,'zwc10',19);
																															commit;
update student set age = 18 where id =10;
# 由于上面事务A更新了id=10的记录，因此这条记录中会有一个历史版本，由于是当前事务更新的，因此使用MVCC读取历史快照时，可以读取到这条记录
select * from student where id>8;
```

## 总结

<img src="https://img.leftover.cn/img-md/202408241634786.png" alt="7c495c628a52baa1e931a12c3c4e0345_720" style="zoom:67%;" />

>这个是MySQL中不同的隔离级别对三大读问题的解决情况



# MySQL中的日志

- 慢查询日志：记录执行时间超过`long_query_time`的所有查询
- 通用查询日志（general query log）：记录所有的日志，对于`复原操作的实际场景`、`发现问题`很有帮助
- 错误日志（error log）：记录MySQL服务的启动、运行、终止时出现的问题
- 二进制日志（bin log）：记录所有`更改数据的语句`(不记录查询语句)，用于`主从服务器之间的数据同步`，以及`服务器遇到故障时数据的无损失恢复`
- 中继日志（replay log）：slave用来存放master 的bin log的一个中间文件，slave读取replay log来同步master的操作

>master (bin log) -> slave(replay log) -> slave读取 replay log 进行主从同步

- 数据库定义语句日志（DDL log）：记录数据定义语句执行的元数据操作

## 通用查询日志（general query log）

该日志默认是关闭的，由于这个日志会记录所有的操作，因此其日志文件可能会非常大

```sql
SHOW VARIABLES LIKE '%general%';
#结果：
general_log       	OFF
general_log_file	  /usr/local/mysql/data/zhangwehaodeMBP.log
```

```sql
# 开启 general query log(也可以在配置文件中设置)
set GLOBAL general_log = on
```

## 错误日志（error log）

**该日志默认开启，且不可以被关闭**

```sql
# 查询error log的日志文件
show VARIABLES like 'log_error'
```

## 中继日志（replay log）

<img src="https://img.leftover.cn/img-md/202408250142167.png" alt="image-20240825014230080" style="zoom:33%;" />

主从架构中，slave需要从master上读取 bin log的内容，并将读取到的数据写入本地的 replay log 中，然后从replay log中读取内容对slave服务器的数据进行更新，从而完成主从的数据同步。

文件名的格式是： 从服务器名 -relay-bin.序号 。中继日志还有一个索引文件： 从服务器名 -relaybin.index ，用来定位当前正在使用的中继日志

replay log和bin log的格式一样，因此也可以使用查看bin log的工具来查看replay log，例如`mysqlbiblog`

## 二进制日志（bin log）

binlog 即 binary log，二进制日志文件，也叫作变更日志（update log）。它记录了数据库所有执行的 DDL 和 DML 等数据库更新事件的语句，但是不包含没有修改任何数据的语句（如数据查询语句select、show等）。应用于`数据恢复`和`数据复制（主从同步）`



```sql
# 查看bin log的相关配置
show variables like '%log_bin%';
# 结果
log_bin	  ON # 是否开启bin log
log_bin_basename	/usr/local/mysql/data/mysql-bin # bin log的文件名
log_bin_index	/usr/local/mysql/data/mysql-bin.index
log_bin_trust_function_creators	OFF  #是否信任函数，由于函数中有类似now（）之类的函数，每一次执行的结果不同，因此若信任函数的话可能同步/恢复的数据可能有问题
sql_log_bin	ON  #是一个session 级别的参数，用于控制当前 session 的一些DDL，DML是否写入bin log
```

查看当前 mysql 中所有的 bin log 文件列表及大小。

```sql
SHOW BINARY LOGS;
```



### 查看bin log的内容 以及使用bin log 恢复数据

1. ```sql
   mysqlbinlog -v "/usr/local/mysql/data/mysql-bin.000004"
   ```

2. ```sql
   show binlog events IN 'mysql-bin.000004';
   ```

   <img src="https://img.leftover.cn/img-md/202408242349677.png" alt="image-20240824234956482" style="zoom: 50%;" />

3. 根据`show binlog events ` 命令中的偏移量来恢复

```sql
mysqlbinlog --start-position=237  --stop-position=493 /usr/local/mysql/data/mysql-bin.000004 | mysql -uroot -p
```

<img src="https://img.leftover.cn/img-md/202408242352951.png" alt="image-20240824235235855" style="zoom:50%;" />

<img src="https://img.leftover.cn/img-md/202408250007438.png" alt="image-20240825000721386" style="zoom: 50%;" />



### 删除bin log

```sql
# 删除该文件名之前的bin log
purge {master| binary} logs to 'mysql-bin.000002' # 删除000001 bin log文件

# 删除指定日期之前创建的所有bin log
purge {master | binary} logs before '指定日期'

# 查看指定bin log的内容，可以知道文件创建的时间
mysqlbinlog --no-defaults "mysql-bin.000002"

# 删除所有的bin log
reset master;
```



### bin log的写入流程

bin log的写入和redo log 很像，先写入内存中的cache中，之后再写入磁盘（写入磁盘的时机由`sync_binlog`控制）

<img src="https://img.leftover.cn/img-md/202408250054299.png" alt="image-20240825005415102" style="zoom:45%;" />

`sync_binlog`:

- 0 :表示每次提交事务都只write，由系统自行判断什么时候执行fsync 写入磁盘
- 1（默认）:每次提交事务之前都会写入磁盘
- \>1: 表示每次提交事务都write，但累积N个事务后才fsync 写入磁盘。

>1 不会有丢失数据的风险，0和>1 都有丢失数据的风险

`binlog_cache_size`:

```sql
show VARIABLES like 'binlog_cache_size' # 默认32KB
```

### bin log 和 redo log 的对比

redo log 它是 物理日志 ，记录内容是“在某个数据页上做了什么修改”，属于 InnoDB 存储引擎层。

而 binlog 是 逻辑日志 ，记录内容是语句的原始逻辑，即sql语句，属于MySQL Server 层。

### 两阶段提交

1. 两阶段提交的整体流程

   ![image-20240825012159074](https://img.leftover.cn/img-md/202408250121133.png)

   

   >1. 写入 redo log，处于 prepare 状态。
   >2. 写 binlog。
   >3. 修改 redo log 状态变为 commit。

2. `为什么要有两阶段提交？`

   无两阶段提交时，要么我们需要将bin log 和 redo log 分别写入磁盘，那么一定会有一个先后顺序。

   - 假设先写bin log 再写 redo log，那么若bin log 写完之后 mysql 宕机了，此时恢复之后slave 会根据bin log 同步数据，因此slave 上是更新之后的数据，而master 根据redo log来进行恢复，因为redo log 还没来得及写入磁盘，因此mysql恢复之后 master上还是未更新前的数据，造成了主从数据不一致的情况。
   - 假设先写redo log 再写bin log，若redo log 写完之后 mysql 宕机了，mysql 恢复后，master 根据redo log 进行恢复，master上是更新之后的数据，而由于还没有写入bin log中，因此 slave 中还是更新前的数据，造成了主从数据不一致的情况。

3. `两阶段提交如何解决主从数据不一致的问题？`

   两阶段提交将redo log 的写入分成了两个阶段，prepare阶段，commit阶段

   - 假设写入redo log 之后 mysql 崩溃了，此时bin log 还没有写入、redo log 还没commit，因此此时mysql重启之后会回滚到事务开始之前
   - 假设写完bin log之后mysql 崩溃了，此时redo log 处于prepare状态，mysql重启之后，会检查bin log中的事务是否存在且完整，若binlog 写入了且完整，那么则直接提交事务，否则回滚事务
   - 如果redo log 处于commit 状态时崩溃了，重启后的处理方案同上一个。



### bin log 的format

`binlog_format` 用于指定bin log 的记录格式。有3个值

- statment： 记录的是sql语句

  1. 优点：
     - 由于只记录的sql语句，因此日志文件比较小
  2. 缺点：
     - SQL语句的执行可能受环境影响（如用户变量，触发器，存储过程），在某些情况下可能无法在从库上重现主库的行为
     - 一些`非确定性的函数操作`可能导致主从数据不一致

- row（默认）：将`每一行数据的变更`记录到bin log中，会包含每一行的旧值和新值

  1. 优点：
     - 能够精确地记录每一行的更改，避免了因为非确定性的函数或一些环境因素导致的复制不一致的问题
  2. 缺点：
     - 日志文件比较大，尤其是涉及大批量数据的更改时

- mixed：结合了statment 和row 的优点，会根据SQL语句的特性自动选择合适的记录方式（一些确定性的SQL语句，采用statment格式，一些可能导致复制不一致的SQL，采用row格式）

  1. 优点：
     - 在性能和数据一致性之间取得了平衡

  



# 主从复制

1. 主从复制的作用？

   - 读写分离
   - 高可用
   - 数据备份

2. 主从复制的整体流程

   <img src="https://img.leftover.cn/img-md/202408251420735.png" alt="image-20240825142050612" style="zoom:50%;" />

## docker compose 搭建mysql 主从

1. docker compose 文件

```yml
version: '3.7'

services:
  mysql-master:
    image: mysql:8.0
    container_name: mysql-master
    environment:
    # root密码
      MYSQL_ROOT_PASSWORD: your root password
      # master 3307

    ports:
    #端口号自己调整
      - "3307:3306"
    volumes:
      - ./master/data:/var/lib/mysql
      - ./master/my.cnf:/etc/mysql/my.cnf
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - mysqlnet

  mysql-slave:
    image: mysql:8.0
    container_name: mysql-slave
    environment:
    # root密码
      MYSQL_ROOT_PASSWORD: your root password
      # slave 3308
    ports:
     #端口号自己调整
      - "3308:3306"
    volumes:
      - ./slave/data:/var/lib/mysql
      - ./slave/my.cnf:/etc/mysql/my.cnf
    depends_on:
      - mysql-master
    networks:
      - mysqlnet

networks:
  mysqlnet:
    driver: bridge

```

master的配置文件`my.cnf`

```cnf
[mysqld]
server-id=1
log_bin=mysql-bin
# 表示可读可写
read-only=0
#[可选]设置日志文件保留的时长，单位是秒
# binlog_expire_logs_seconds=6000
#[可选]控制单个bin log大小。此参数的最大和默认值是1GB
#max_binlog_size=200M
#[可选]设置不要复制的数据库
#binlog-ignore-db=test
#[可选]设置需要复制的数据库,默认全部记录。比如：binlog-do-db=atguigu_master_slave
#binlog-do-db=需要复制的主数据库名字
#[可选]设置binlog格式，默认为row
#binlog_format=STATEMENT
```

slave的配置文件,`my.cnf`

```cnf
[mysqld]
server-id=2
log_bin=mysql-bin
relay_log=relay-bin
read_only=1  #只读，0是可读可写
```

`docker-compose up -d` 启动docker 容器

2. 配置主从复制

   ```shell
   # 进入主库的容器中
   docker exec -it mysql-master bash
   
   # 登录mysql
   mysql -u root -p
   
   # 创建用于主从复制的用户
   CREATE USER 'replica'@'%' IDENTIFIED BY 'replica password';# 自己设置密码和需要创建的用户名
   GRANT REPLICATION SLAVE ON *.* TO 'replica'@'%';
   FLUSH PRIVILEGES;
   # 记住file 和position，之后会用到
   SHOW MASTER STATUS; 
   ```

   <img src="https://img.leftover.cn/img-md/202408251721140.png" alt="image-20240825172127954" style="zoom:50%;" />

```shell
# 进入从库容器并登录mysql
docker exec -it mysql-slave bash
mysql -u root -p
# 配置从库连接到主库
# 根据情况修改密码，pos，log_file的值
CHANGE MASTER TO MASTER_HOST='mysql-master',MASTER_USER='replica',MASTER_PASSWORD='replicapassword',MASTER_LOG_FILE='mysql-bin.000001', MASTER_LOG_POS=833; 
# 启动slave
START SLAVE;
# 若Slave_IO_Running 和 Slave_SQL_Running 都是 Yes，说明配置成功。
SHOW SLAVE STATUS\G
```



## 使用 shardingsphere 配置读写分离

>配置数据库连接池时，不能使用Druid连接池，否则会报错

```xml
 <!-- pom.xml -->
<!--springboot 3.2.9 -->
        <dependency>
            <groupId>org.apache.shardingsphere</groupId>
            <artifactId>shardingsphere-jdbc</artifactId>
            <version>5.5.0</version>
            <exclusions>
                <exclusion>
                    <groupId>org.apache.shardingsphere</groupId>
                    <artifactId>shardingsphere-test-util</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-spring-boot3-starter</artifactId>
            <version>3.5.7</version>
        </dependency>
```

```yml
# application.yml
spring:
  application:
    name: read_write_code
  datasource:
    driver-class-name: org.apache.shardingsphere.driver.ShardingSphereDriver
    url: jdbc:shardingsphere:classpath:sharding.yml
```

```yml
#sharding.yml
dataSources:
  master:
    driverClassName: com.mysql.cj.jdbc.Driver
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    jdbcUrl: jdbc:mysql://localhost:3307/test?allowPublicKeyRetrieval=true&useSSL=false
    username: root
    password: zwc666666
  slave1:
    driverClassName: com.mysql.cj.jdbc.Driver
    dataSourceClassName: com.zaxxer.hikari.HikariDataSource
    jdbcUrl: jdbc:mysql://localhost:3308/test?allowPublicKeyRetrieval=true&useSSL=false
    username: root
    password: zwc666666
rules:
  - !SINGLE
    tables:
      - "*.*"
    defaultDataSource: master # 创建table时使用的数据源
  - !READWRITE_SPLITTING
    dataSources:
      readwrite_ds:
        writeDataSourceName: master
        readDataSourceNames:
          - slave1
        transactionalReadQueryStrategy: PRIMARY
        loadBalancerName: random
    loadBalancers:
      random:
        type: RANDOM
props:
  sql-show: true

```
强制走主库，也可以定义一个aop，这样更方便

```java
          			HintManager.clear();
            		try (HintManager hintManager = HintManager.getInstance()) {
                hintManager.setWriteRouteOnly();
                 // do something...
                }finally {
                  	HintManager.clear();
                }    
```



## 主从延迟

### 理解主从的延迟

主从复制的延迟来自两方面，一是主库和从库之间网络IO的延迟，二是从库读取replay log 进行重放的时间（因此导致了客户端读取的时候读取的可能不是最新的数据，即主从同步中的`数据不一致`的问题）

### 如何减少主从延迟

1. 减少长事务的执行
2. 提高从库机器的配置
3. 采用`短的链路`、`提高端口带宽`，减少bin log传输的网络时延

## 怎么解决主从同步过程中的数据不一致的问题

读写分离情况下，解决主从同步中数据不一致的问题， 就是解决主从之间 数据复制方式 的问题，如果按照数据一致性 从弱到强 来进行划分，有以下 3 种复制方式。

**异步方式：**

就是master写入了bin log之后直接commit，由其他线程将bin log文件同步给slave

> master的效率高，数据一致性最差
>
> - 写入bin log之后master挂了，此时slave充当master，这时候客户端读取的就是旧数据
> - slave这边还没写入之前，客户端就读取了数据，可能读到旧数据

**同步方式：**

最严格的复制模式，要求master在提交事务之前，必须等待`所有`slave确认`收到了bin log并应用了事务之后`,master 才向客户端返回事务提交成功的信息

<img src="https://img.leftover.cn/img-md/202408260037324.png" alt="image-20240826003712224" style="zoom:33%;" />

**半同步方式：**

即客户端提交commit之后不直接将结果返回给客户端，而是等待`至少有一个从库接收到了bin log 并写入了replay log中`，不需要等待slave应用了事务，将结果返回给客户端

<img src="https://img.leftover.cn/img-md/202408260026294.png" alt="image-20240826002614158" style="zoom:50%;" />

>相比异步复制来说，降低了master的效率

# 性能分析

## SQL 优化的步骤

<img src="https://img.leftover.cn/img-md/202408161532828.png" alt="image-20240816153222791" style="zoom:50%;" />

## 优化的手段

<img src="https://img.leftover.cn/img-md/202408161526508.png" alt="image-20240816152604465" style="zoom:50%;" />

1. 优化SQL语句和建立索引

2. 优化数据库的表结构，添加冗余字段，减少join的次数

3. 根据业务的实际情况调整mysql的参数配置（具体查看[优化 MySQL 的配置的场景参数](#优化mysql的配置的场景参数)）

4. 分库分表，搭建主从、读写分离

5. 提高服务器的整体硬件配置

   >- 提高内存
   >- 使用SSD，随机访问和顺序访问速度几乎一致，可以减少随机IO带来的性能损耗

## 查看系统性能参数

<img src="https://img.leftover.cn/img-md/202408131655664.png" alt="image-20240813165546534" style="zoom:40%;" />

## 统计SQL 的查询成本：last_query_cost

统计的是上一条SQL 的查询成本（**即 SQL 语句所需要读取的页的数量**）

```sql
show status like 'last_query_cost'
```

```sql
SELECT student_id, class_id, NAME, create_time FROM student_info
WHERE id = 900001;  #花费10ms 1页
SELECT student_id, class_id, NAME, create_time FROM student_info
WHERE id > 900001 #花费80ms 41839 页
```

可以看出这两个查询读取的页的数量相差很大，但是查询的效率只是相差8倍，这是因为第二个查询采用了顺序读取的方式将页面一次性加载到缓冲池中，虽然`页数量`增加了不少，但是通过顺序IO+缓冲池 ，查询时长并没有增加特别多

>1. 如果页就在数据库`缓冲池`中，那么效率是最高的，否则还需要从`内存`或者`磁盘`中进行读取
>2. 如果我们从磁盘中对单一页进行随机读，那么效率是很低的（10ms左右），而采用顺序读取的方式，批量对页进行读取，那么效率就会提升很多

## 慢查询

1. 开启慢查询(默认关闭)

   ```sql
   set GLOBAL slow_query_log = ON
   ```

   ```sql
   show VARIABLES like '%slow_query_log%'
   ```

   <img src="https://img.leftover.cn/img-md/202408131729172.png" alt="image-20240813172942065" style="zoom: 50%;" />



2. 设置慢查询的时间阈值（默认10s）

   ```sql
   set GLOBAL long_query_time = 1
   show GLOBAL VARIABLES like 'long_query_time'
   ```

3. 修改配置文件

```sql
[mysqld]
slow_query_log=ON # 开启慢查询
slow_query_log_file=/usr/local/mysql/data/mysql-slow.log # 慢查询日志文件
long_query_time=1 # 慢查询的阈值 1s
log_output=FILE                
```

>  除了 long_query_time 变量来控制慢查询的时长阈值，还有一个系统变量。min_examined_row_limit （扫描过的最少记录数，默认为 0）。 long_query_time 和 min_examined_row_limit 共同组成了判断一个查询是否是慢查询的条件，如果查询扫描过的记录数 >=  min_examined_row_limit ,且查询执行时间 >=  long_query_time ,那么这个查询就会被记录到慢查询日志中
>
>  可以根据特殊需求来修改 min_examined_row_limit 这个值（没特殊情况不修改）

## 慢查询日志分析工具 mysqldumpslow

使用该命令可以查看对应的慢查询的SQL语句

```java
mysqldumpslow -a /usr/local/mysql/data/mysql-slow.log
```



## 查询SQL 的执行成本 SHOW PROFILE

```sql
#开启show profile
set profiling = 'ON';
```

```sql
# 查询当前会话下有哪些profiles
show profiles;
```

```sql
# 查询某条 SQL 的执行成本
show profile all for query 201;
```

<img src="https://img.leftover.cn/img-md/202408141424071.png" alt="image-20240814142407946" style="zoom:33%;" />

**show profile的常用查询参数：**

- ALL：显示所有的开销信息。
- BLOCK IO：显示块IO开销。
- CONTEXT SWITCHES：上下文切换开销。 
- CPU：显示CPU开销信息。 
- IPC：显示发送和接收开销信息。 
- MEMORY：显示内存开销信息。 
- PAGE FAULTS：显示页面错误开销信息。 
- SOURCE：显示和Source_function，Source_file，Source_line相关的开销信息。 
- SWAPS：显示交换次数开销信息。

## Explain

- id: 在一个大的查询语句中，每一个select 关键字都对应一个 id

  >- id 相同，则认为是同一组，从上往下执行
  >- 在所有组中，id值越大，优先级越高，越先执行

- select_type:

 常见的类型：
| 名称               | 描述                                                         |
| ------------------ | ------------------------------------------------------------ |
| simple             | 没有使用union 或者 子查询 都称为simple select                |
| primary            | 外层的主查询                                                 |
| union              | union关键字之后的 查询语句                                   |
| union result       | union的一个结果集（union合并两张表生成一张临时表，之后再对临时表进行去重，对临时表去重的操作类型就叫做union result） |
| subquery           | 子查询                                                       |
| dependent subquery | 相关子查询，依赖于外部查询                                   |
| derived table      | 派生表                                                       |

- table： 查询的是哪张表（表名）

- type：表明对某个表是怎么进行查询的

  - system: 访问只有一行数据的表
  - const：当我们根据`主键`或者`唯一 二级索引列` 与`常数进行等值匹配`时，对单表的访问方法就是`const`

  ```sql
   EXPLAIN SELECT * FROM s1 WHERE id = 10005;
  
   EXPLAIN SELECT * FROM s1 WHERE key2 = 10066;
  ```

  - eq_ref:

    在进行连接查询时，如果被驱动表是通过 `主键` 或者`唯一 二级索引列 等值匹配`的方式进行访问的，则对该被驱动表的访问方法就是 `eq_ref`

    ```sql
     EXPLAIN SELECT * FROM s1 INNER JOIN s2 ON s1.id = s2.id;
    ```

  - ref:

    当通过普通的二级索引列与常量进行等值匹配时来查询某个表，那么对该表的访问方法就可能是`ref`

    >如果进行了类型的隐式转换，则不会走索引

    ```sql
     EXPLAIN SELECT * FROM s1 WHERE key1 = 'a';
    ```

  - ref_or_null: 通过普通二级索引进行等值匹配查询时，该索引列的值也可以是 `null`时，那么对该表的访问方法是`ref_or_null`

    >其实跟ref区别不大，就是多了一种null的等值匹配的场景

    ```sql
     EXPLAIN SELECT * FROM s1 WHERE key1 = 'a' OR key1 IS NULL;
    ```

  - fulltext：

    使用了fulltext索引

  - index_merge:

    表示 MySQL 在查询时使用了多个索引，并将这些索引的结果进行合并来获取最终的数据集
  
    ```sql
     # 下面的例子中，key1 和key3都使用了索引，并将索引的结果进行合并获得最终的结果集
     EXPLAIN SELECT * FROM s1 WHERE key1 = 'a' OR key3 = 'a';
    ```

  - unique_subquery：

    `unique_subquery` 是 MySQL 优化器用来处理某些带有子查询的 `IN` 或 `=` 操作的特殊访问方法。具体来说，当子查询返回的结果集是唯一的（即，子查询的结果集中的每一行都可以唯一地映射到主查询中的一个行），MySQL 会使用 `unique_subquery` 访问类型
  
    ```sql
     # s2中的key2是具有唯一索引/主键
     EXPLAIN SELECT * FROM s1 
     WHERE key2 IN (SELECT  key2 FROM s2 WHERE s1.key3 = s2.key3) OR key3 = 'a';
    ```
  
  - index_subquery:
    
    
    
  - range:
    
    如果使用索引获取某些`范围区间`的记录,那么可能使用到range访问方法
    
    ```sql
     EXPLAIN SELECT * FROM s1 WHERE key1 IN ('a', 'b', 'c');
     EXPLAIN SELECT * FROM s1 WHERE key1 > 'a' AND key1 < 'b';
    ```
  
  - index：
  
    index 和 ALL 类似，但是他扫描的是整个`索引树`，而不是整个table
  
    - 例如索引覆盖到场景，可能where查询条件中不能使用索引，但是只是select 了部分字段，可以使用覆盖索引，因此还是会使用索引，会扫描整个索引树（索引的大小通常 < 表数据，因此这样比全表扫描更加高效）
  
    ```sql
     #当我们可以使用索引覆盖，但需要扫描全部的索引记录时，该表的访问方法就是`index`
     EXPLAIN SELECT key_part2 FROM s1 WHERE key_part3 = 'a';
    ```
  
  - ALL：全表扫描
  
    <img src="https://img.leftover.cn/img-md/202408141833101.png" alt="image-20240814183328974" style="zoom:50%;" />

- possible_keys 和key：possible_keys 为可能会用到的索引；key 是实际使用到的索引

- key_len: 实际使用的索引的长度

- ref：当使用索引列 `等值查询`时，与索引列进行等值匹配的对象信息。（例如可能是const、func、其他表的某一列）

- rows：预估的需要读取的记录条数

- filtered: 这个字段表示存储引擎返回的数据在server层过滤后，剩下多少满足查询的记录数量的百分比 (越大越好)

- extra： 额外的信息

  - using index： MySQL 仅使用索引中的信息来满足查询，而不需要访问表中的实际数据行（即使用了覆盖索引）

  - using where：MySQL 在提取数据后应用了 `WHERE` 子句中的条件，这意味着 MySQL 不能通过索引完全满足查询条件，需要进一步过滤。

  - Using index condition：使用了`索引下推`

  - Using join buffer (hash join): 在进行连接操作时，被驱动表不能使用索引高效处理时，MySQL 会为其分配一块名为`join buffer` 的内存块来加快查询速度。（也就是我们所讲的`基于块的嵌套循环算法`）

  - using filesort: MySQL 需要对数据进行排序，但排序无法通过索引完成，因此需要执行额外的排序操作（即 文件排序）。

  - using temporary: 在查询时使用到了临时表。在执行许多包含`DISTINCT`、`GROUP BY`、`UNION`等子句的查询过程中，如果不能有效利用索引来完成

    查询，MySQL很有可能寻求通过建立内部的临时表来完成查询

    >建立和维护临时表需要付出很大的成本，因此最好能使用索引来替代使用临时表

## Explain 的进一步使用

```sql
# 输出为json格式（信息量最全面）
explain format = json xxx
# 输出为tree格式
explain format = tree xxx
```



## show warnings的使用

先使用expain 分析某条SQL，再执行`show warnings`,可以看到具体的 SQL 的执行语句（因为优化器会改造我们的SQL，例如替换join的顺序，将子查询转换为join）

```sql
EXPLAIN SELECT * FROM s1 WHERE key1 IN (SELECT key2 FROM s2 WHERE common_field= 'a')

show warnings;

# 结果如下，可以看出它将子查询优化为了join操作
# select `atguigudb1`.`s1`.`id` AS `id`,`atguigudb1`.`s1`.`key1` AS `key1`,`atguigudb1`.`s1`.`key2` AS 
#`key2`,`atguigudb1`.`s1`.`key3` AS `key3`,`atguigudb1`.`s1`.`key_part1` AS `key_part1`,`atguigudb1`.`s1`.`key_part2` AS 
#`key_part2`,`atguigudb1`.`s1`.`key_part3` AS `key_part3`,`atguigudb1`.`s1`.`common_field` AS `common_field` from 
#`atguigudb1`.`s2` join `atguigudb1`.`s1` where ((`atguigudb1`.`s2`.`common_field` = 'a') and 
#(cast(`atguigudb1`.`s1`.`key1` as double) = cast(`atguigudb1`.`s2`.`key2` as double)))
```

## 分析优化器执行计划：trace

```sql
# 开启优化器追踪，输出格式为json
SET optimizer_trace="enabled=on",end_markers_in_json=on;
# 设置最大的内存，由于输出的是json，可能会比较大，若内存不足则会被截断
set optimizer_trace_max_mem_size=1000000;

# 执行对应的sql
select * from student where id < 10;
# 查询对应的执行计划
select * from information_schema.optimizer_trace;
```

>这里我在navicat上面试了一下好像有点问题，命令行没问题，最好是命令行登录mysql进行测试

##  MySQL 监控分析视图 sys schema

<img src="https://img.leftover.cn/img-md/202408151650707.png" alt="image-20240815165058602" style="zoom:50%;" />

<img src="https://img.leftover.cn/img-md/202408151652969.png" alt="image-20240815165209920" style="zoom: 67%;" />

# 数据备份与恢复

**物理备份：** 直接备份数据文件，将数据库的物理文件备份到别的地方，**物理备份恢复速度快，但是占用空间大,可以使用 xtrabackup 来进行物理备份**

**逻辑备份：** 即备份sql语句，MySQL在可以使用`mysqldump`命令进行逻辑备份，**逻辑备份恢复速度慢，占用空间小**

## mysqldump

```shell
# 备份test数据库下的所有表
mysqldump -u root -p --databases test > test.sql
# 备份test数据库下的表结构，不备份具体的数据
mysqldump -u root -p --databases test --no-data > nodata.sql
# 只备份具体的数据，不会备份表结构
mysqldump -u root -p --databases test --no-create-info > onlydata.sql
```

```shell
# 根据sql文件恢复数据
mysql -u root -p test < test.sql # 恢复到test数据库中
```

## 物理备份

物理备份比较复杂，可以使用专门的工具，例如[xtrabackup](https://www.percona.com/mysql/software/percona-xtrabackup),只支持Linux

## 表的导出

表的导出受到 `secure_file_priv` 变量的影响

- null： 不允许导出
- “”: 可以导出到磁盘的任意位置
- 具体的文件路径：只能导出到该文件路径下

1. 

```sql
# 将select 的数据导出到某个文件中
select * from your_table into outfile 'xxx'
```

2. 
```shell
   # 这条命令是将test数据库下的student表导出
   mysqldump -u root -p -T '具体的文件路径' test student
```

3. 
```shell
   # 这条命令的作用是将前面mysql命令的执行结果输出到后面的文件中
   # --xml 可以以xml的格式输出
   mysql -u root -p --execute="select *from student1" test > /Users/leftover/Desktop/student1.xlsx
```

## 表的导入

1. load data infile  ... into table
 ```sql
   # 将hh.txt文件中的数据导入到test数据库的student表中
   load data INFILE '/usr/local/mysql/data/hh.txt' into TABLE test.student
 ```

2. mysqlimport 命令
 ```shell
   # 将hh.txt的数据导入到test数据库下的hh表中（文件名和表名需要一致）
  mysqlimport -uroot -p test '/usr/local/mysql/data/hh.txt'
 ```

## 数据的回滚

### delete的删除

可以使用一些[flashback工具](https://juejin.cn/post/6950641397695250439#heading-0)进行回滚，本质上是通过对bin log 的分析进行一个回滚，例如美团开源的[MyFlash](https://github.com/Meituan-Dianping/MyFlash)，[binlog2sql](https://github.com/danfengcao/binlog2sql)可以将binlog转为sql再进行一个手动的重放。其他工具可以查看[MySQL Flashback 工具介绍](https://juejin.cn/post/6950641397695250439#heading-2)



**预防：** 将`sql_safe_updates` 参数设置为 `on` 。这样的话delete/update语句必须写where条件，且必须命中索引，否则报错（或者编写limit）

### truncate/drop 误删除表、库

1. 取出最近的一次`全量备份`，再根据bin log进行一个增量的重放（因此我们需要对数据库定时做全量备份）

### 删库删表的预防

1. 搭建主从，且主从同步的时间设置的长一些，例如1h。通过 CHANGE MASTER TO MASTER_DELAY = N 命令，可以指定这个备库持续保持跟主库有 N秒的延迟 。这样当master上误删除数据时，可以在slave上执行`stop slave`,停止同步，之后根据bin log日志进行一个重放
2. 进行严格的权限管理，只给少部分人删除的权限，日常只使用`只读权限`的账号，只有在必要的时候才使用有`更新权限`的账号
3. 如果确定需要删除表时，**可以先对表做改名操作，之后确定没问题了之后再真正删除**

# Reference

## 优化MySQL的配置的场景参数

- `innodb_buffer_pool_size` ：这个参数是Mysql数据库最重要的参数之一，表示InnoDB类型的表和索引的最大缓存 。它不仅仅缓存索引数据 ，还会缓存表的数据 。这个值越大，查询的速度就会越快。但是这个值太大会影响操作系统的性能。

- `key_buffer_size` ：表示 索引缓冲区的大小 。索引缓冲区是所有的 线程共享 。增加索引缓冲区可以得到更好处理的索引（对所有读和多重写）。当然，这个值不是越大越好，它的大小取决于内存的大小。如果这个值太大，就会导致操作系统频繁换页，也会降低系统性能。对于内存在 4GB 左右的服务器该参数可设置为 256M 或 384M 。
- `table_cache` ：表示同时打开的表的个数 。这个值越大，能够同时打开的表的个数越多。物理内存越大，设置就越大。默认为2402，调到512-1024最佳。这个值不是越大越好，因为同时打开的表太多会影响操作系统的性能。

- `query_cache_size` ：表示 查询缓冲区的大小 。可以通过在MySQL控制台观察，如果Qcache_lowmem_prunes的值非常大，则表明经常出现缓冲不够的情况，就要增加Query_cache_size的值；如果Qcache_hits的值非常大，则表明查询缓冲使用非常频繁，如果该值较小反而会影响效率，那么可以考虑不用查询缓存；Qcache_free_blocks，如果该值非常大，则表明缓冲区中碎片很多。MySQL8.0之后失效。该参数需要和query_cache_type配合使用。
  - query_cache_type=0时，所有的查询都不使用查询缓存区。但是query_cache_type=0并不会导致MySQL释放query_cache_size所配置的缓存区内存。
  - query_cache_type=1时，所有的查询都将使用查询缓存区，除非在查询语句中指定SQL_NO_CACHE ，如SELECT SQL_NO_CACHE * FROM tbl_name。
  - query_cache_type=2时，只有在查询语句中使用 SQL_CACHE 关键字，查询才会使用查询缓存区。使用查询缓存区可以提高查询的速度，这种方式只适用于修改操作少且经常执行相同的查询操作的情况。

- `sort_buffer_size` ：表示每个需要进行排序的线程分配的缓冲区的大小 。增加这个参数的值可以提高 ORDER BY 或 GROUP BY 操作的速度。InnoDB默认为1M。对于内存在4GB左右的服务器推荐设置为6-8M，如果有100个连接，那么实际分配的总共排序缓冲区大小为100 × 6＝ 600MB。

- `join_buffer_size`  ：表示连接查询操作所能使用的缓冲区大小 ，和sort_buffer_size一样，该参数对应的分配内存也是每个连接独享。

- `read_buffer_size` ：表示 每个线程连续扫描时为扫描的每个表分配的缓冲区的大小（字节） 。当线程从表中连续读取记录时需要用到这个缓冲区。SET SESSION read_buffer_size=n可以临时设置该参数的值。默认为64K，可以设置为4M。
- `innodb_flush_log_at_trx_commit` ：表示 何时将缓冲区的数据写入日志文件 ，并且将日志文件写入磁盘中。该参数对于innoDB引擎非常重要。该参数有3个值，分别为0、1和2。该参数的默认值为1。
  - 值为 0 时，表示 每秒1次 的频率将数据写入日志文件并将日志文件写入磁盘。每个事务的commit并不会触发前面的任何操作。该模式速度最快，但不太安全，mysqld进程的崩溃会导致上一秒钟所有事务数据的丢失。
  - 值为 1 时，表示 每次提交事务时 将数据写入日志文件并将日志文件写入磁盘进行同步。该模式是最安全的，但也是最慢的一种方式。因为每次事务提交或事务外的指令都需要把日志写入（flush）硬盘。
  - 值为 2 时，表示 每次提交事务时 将数据写入日志文件， 每隔1秒 将日志文件写入磁盘。该模式速度较快，也比0安全，只有在操作系统崩溃或者系统断电的情况下，上一秒钟所有事务数据才可能丢失。

- `innodb_log_buffer_size` ：默认16M，这是 InnoDB 存储引擎的redo log所使用的缓冲区 。为了提高性能，也是先将信息写入 Innodb Log Buffer 中，当满足 innodb_flush_log_trx_commit 参数所设置的相应条件（或者日志缓冲区写满）之后，才会将日志写到文件（或者同步到磁盘）中。

- `max_connections` ：表示 允许连接到MySQL数据库的最大数量 ，默认值是 151 。如果状态变量connection_errors_max_connections 不为零，并且一直增长，则说明不断有连接请求因数据库连接数已达到允许最大值而失败，这时可以考虑增大max_connections 的值。在Linux 平台下，性能好的服务器，支持 500-1000 个连接不是难事，需要根据服务器性能进行评估设定。这个连接数 不是越大越好 ，因为这些连接会浪费内存的资源。过多的连接可能会导致MySQL服务器僵死。
- `back_log` ：用于 控制MySQL监听TCP端口时设置的积压请求栈大小 。如果MySql的连接数达到max_connections时，新来的请求将会被存在堆栈中，以等待某一连接释放资源，该堆栈的数量即back_log，如果等待连接的数量超过back_log，将不被授予连接资源，将会报错。5.6.6 版本之前默认值为 50 ， 之后的版本默认为 50 + （max_connections / 5）， 对于Linux系统推荐设置为小于512的整数，但最大不超过900。如果需要数据库在较短的时间内处理大量连接请求， 可以考虑适当增大back_log 的值。

- `thread_cache_size` ： 线程池缓存线程数量的大小 ，当客户端断开连接后将当前线程缓存起来，当在接到新的连接请求时快速响应无需创建新的线程 。这尤其对那些使用短连接的应用程序来说可以极大的提高创建连接的效率。那么为了提高性能可以增大该参数的值。默认为60，可以设置为120。
- `wait_timeout` ：指定一个请求的最大连接时间 ，对于4GB左右内存的服务器可以设置为5-10。

- `interactive_timeout` ：表示服务器在关闭连接前等待行动的秒数。
