# Redis安装

## Mac上下载redis

```shell
brew install redis
```

配置文件位于`/opt/homebrew/etc/redis.conf`



Redis 可视化管理工具

[Another Redis Desktop Manager](https://github.com/qishibo/AnotherRedisDesktopManager/blob/master/README.zh-CN.md)

Mac 上美观度Redis 可视化管理工具

[medis2](https://getmedis.com/)



# Redis学习资源

0. [官方文档](https://redis.io/docs/latest/)(英文，推荐)

1. [Redis 中文文档](https://redis.com.cn/)（非官方，推荐）
2. [Redis 中文的手册](https://www.redisio.com/)(非官方，一般般)

# Redis数据结构及其 命令

## key的层级结构

Redis的key允许多个单词形成层级结构，以`:` 隔开，可以通过`项目名：业务名：类型：id`的方式命名（非强制性）

例如：`leftover:cms:user:999` ，`leftover.backend:user:999`

## 常用通用命令

- KEYS： 查看符合条件的所有key（⚠️不建议在生产环境使用，当key很多的时候，消耗的时间多，且redis是单线程的，会阻塞redis的其他操作）
- DEL： 删除一个指定的Key
- EXISTS：判断key是否存在
- EXPIRE： 给key设置有效期，有效期到期时该key会被自动删除
- TTL：查看一个key的有效时间（单位`s`，key 不存在返回 `-2`，key 存在但是没有设置超时时间返回 `-1`）
- PTTL: 和TTL一样（返回的时间单位`ms`）
- RENAME： 重命名一个key，若newKey存在，则会覆盖原来的key
- RENAMENX:  重命名一个key，仅当 newkey 不存在时，将 key 改名为 newkey
- TYPE:返回 `key` 的类型, `key` 不存在时返回 `none`。(可返回的类型`string`, `list`, `set`, `zset`, `hash` and `stream`)
- MOVE: 将某个key移动到其他数据库（如果 `key` 在目标数据库中已存在，或者 `key` 在源数据库中不存，则`key` 不会被移动。）
- PERSIST：移除 key 的过期时间，key 将持久保持

文档：https://redis.io/docs/latest/commands/?group=generic

## string类型

string类型有3中格式：

- 字符串
- int
- float

1. SET: 设置指定 key 的值

   - `EX` *seconds* – 设置键key的过期时间，单位时秒
   - `PX` *milliseconds* – 设置键key的过期时间，单位时毫秒
   - `NX` – 只有键key不存在的时候才会设置key的值
   - `XX` – 只有键key存在的时候才会设置key的值
   - `KEEPTTL` -- 获取 key 的过期时间

2. GET：获取指定 key 的值

3. SETRANGE:从偏移量 `offset` 开始， 用 `value` 参数覆盖键 `key` 中储存的字符串值。如果键 `key` 不存在，当作空白字符串处理.

   如果键 `key` 中原来所储存的字符串长度比偏移量小(比如字符串只有 `5` 个字符长，但要设置的 `offset` 是 `10` )， 那么原字符和偏移量之间的空白将用零字节 `"\x00"` 进行填充。

4. GETRANGE:返回存储在 key 中的字符串的子串(下标从0开始，可以使用负数)
5. SETEX：设置指定key的值，并设置过期时间（单位`s`,⚠️已废弃，请使用SET）
6. PSETEX：设置指定key的value，并设置过期时间（单位`ms`,⚠️已废弃，请使用SET））
7. SETNX：在指定的 key 不存在时，为 key 设置指定的值（⚠️已废弃，请使用SET）
8. MSET：为多个key设置值(原子操作，所有 key 的值同时设置)
9. MGET：获取多个key的value
10. MSETNX：当且仅当所有给定键都不存在时， 为所有给定键设置值。（原子操作）
11. INCR：将value+1
12. INCRBY：将value加上给定的增量
13. DECR: 将value-1
14. DECRBY：将value减去给定的减量值
15. INCRBYFLOAT：将value加上给定的浮点数增量
16. APPEND:用于为指定的 key 追加值,若key不存在，效果 = SET
17. STRLEN: 返回字符串的长度

## hash类型

value中存储的是hash表，适合用来存储对象

1. HSET：用于为存储在 `key` 中的哈希表的 `field` 字段赋值 `value`  ，若hash表不存在，则会创建一个hash表，若`field` 已经存在，则覆盖旧值

2. HGET：获取存储在哈希表中指定字段的值

3. HMSET：设置多个`filed`的`value`  ( ⚠️已废弃，请使用HSET）

4. HMGET: 获取hash表中多个`field`的值

5. HSETNX: 为hash表的`field`设置值，若`field`已经存在，则不执行

6. HDEL:用于删除哈希表中一个或多个字段



7. HLEN：获取hash表中的字段个数

8. HEXISTS：用于判断哈希表中字段是否存在

9. HINCRBY: 让hash表中的`field`加上指定的整数增量值

10. HINCRBYFLOAT:让hash表中的`field`加上指定的浮点数增量



11. HGETALL:用于返回存储在 `key` 中的哈希表中所有的`field`和`value`

12. HKYES: 获取hash表中所有的`field`

13. HVALS : 获取hash表中的所有`value`



## List类型

List的底层是一个双向链表,类似于Java的`LinkedList`，元素可以重复

1. LPUSH： 从左侧插入一个或者多个元素
2. RPUSH
3. LPOP：移除并返回左侧的第一个元素
4. RPOP
5. BLPOP:移出并获取列表的第一个元素， 如果列表没有元素会阻塞列表直到**等待超时**或**发现可弹出元素**为止,是LPOP的阻塞版本
6. BRPOP:
7. LPUSHHX: 当 key 存在并且存储着一个 list 类型值的时候，向值 list 的头部插入 value
8. RPUSHHX:
9. LINSERT: 将某个值插入到**指定元素**的前面或者后面 。（例如`LINSERT nems before zwc zwc666`）将zwc666插入到zwc前面
10. LSET: 通过index设置list指定位置的值
11. LREM: 从list中删除前 count 个 value 等于 `element` 的元素
    - count > 0: 从头到尾删除值为 value 的元素（最多移除count个）
    - count < 0: 从尾到头删除值为 value 的元素。（最多移除 `|count|` 个）
    - count = 0: 移除所有值为 value 的元素
12. LRANGE: 返回list中指定区间内的元素（`LRANGE nems 0 -1`）
13. LTIRM: 用于修剪(trim)一个已存在的 list，这样 list 就会只包含指定范围的元素(这是很有用的，比如当用 Redis 来存储日志)
14. LLEN：返回List的长度
15. LINDEX：返回 索引 index 位置存储的元素。 index 下标是从 0 开始索引的，可以使用负数

## Set类型

简介：类似于Java中的HashSet集合(无序、元素不可重复、支持交集，并集，差集等)

1. SADD：向set中添加一个/多个元素
2. SREM：移除set中的一个/多个元素
3. SCARD：返回set中元素的个数
4. SPOP：随机删除set中的一个或者多个元素并返回
5. SISMEMBER：判断一个集合是否存在于set中
6. SMEMBERS：返回set中的所有元素
7. SMOVE ：从集合`source` 中移动成员`member` 到集合 `destination`。 这个操作是原子操作。 在任何时刻，`member` 只会存在于`source` 和`destination` 其中之一。
8. SINTER key1 key2: 求key1和key2的交集
9. SDIFF key1 key2: 求key1与key2的差集
10. SUNION key1 key2: 求key1和key2的并集
11. SINTERSTORE：和SINTER类似，但是他会将结果存储到`destination` 集合中
12. SDIFFSTORE：。。。
13. SUNIONSTORE：。。。

## SortedSet（ZSET）

简介：有序的set集合（可排序，元素不可重复、支持交集，并集，差集等），和Java中的TreeSet类似，SortedSet中每一个元素都带有一个score属性，基于score属性对元素排序，底层的实现上一个跳表（SkipList）+hash表（由于其可排序，因此经常用来实现排行榜这样的功能）

1. ZDD：向zset中添加一个/多个元素，若存在则更新其score值
2. ZREM：删除zset中的一个指定元素
3. ZSCORE：获取zset指定元素的score值
4. ZRANK：获取zset中指定元素的排名
5. ZCARD：获取zset中元素的个数
6. ZCOUNT：统计 `score` 值在 `min` 和 `max` 之间的元素数量
7. ZINCRBY：让zset中的指定元素的score加上指定的增量值
8. ZRANGE：返回指定索引区间内的元素
9. ZRANGEBYSCORE：返回指定分数区间内的元素
10. ZRANGEBYLEX： 用于按字典顺序获取有序集合（`zset`）中的元素。(可以指定字母的范围)(它特别适用于按字母顺序排列的场景)
11. ZREMRANGEBYLEX：移除zset中给定的字典区间的所有元素
12. ZREMRANGEBYRANK：移除zset中给定排名区间的所有元素
13. ZREMRANGEBYSCORE：移除zset中给定粉丝区间的元素 
14. ZINTER：交集
15. ZDIFF：差集
16. ZUNION：并集
17. ZINTERSTORE:计算给定的一个或多个有序集的交集并将结果集存储在新的有序集合 key 中
18. ZDIFFSTORE: 。。。
19. ZUNIONSTORE： 。。。

⚠️：所有排名默认是**升序**的，若要降序，则在命名的Z后面添加`REV`即可



## GEO

GEO的底层使用的是redis的**ZSet**，添加一个坐标元素（给定经纬度），会通过一个算法转化为一串数字作为zset的score，value则自己提供

<img src="https://img.leftover.cn/img-md/202407031950655.png" alt="image-20240703195015547" style="zoom: 30%;" />

1. GEOADD: 将指定的地理空间位置（纬度、经度、名称）添加到指定的key中
2. GEODIST: 返回两个元素之间的距离
3. GEOHASH： 返回一个或多个位置元素的 Geohash 表示
4. GEOPOS: 返回一个或多个位置元素的位置（经度和纬度）
5. GEORADIUS：以给定的经纬度为中心， 找出某一半径内的元素（已废弃，请使用GEOSEARCH）
6. GEOSEARCH：查找指定范围内的元素（可以按圆查找，也可以按矩形查找；可以使用给定的的经纬度作为中心点，也可以使用某个位置元素作为中心点）
7. GEOSEARCHSTORE：和`GEOSEARCH`类似，不过它会将查找到的结果存储在指定的key中

## BitMap

redis的BitMap是基于**string**类型实现的，所以最大上限为512M，2^32 bit

1. SETBIT: 向指定位置存入一个0或者1， **返回这个位置原来的值（0/1）**
2. GETBIT：获取指定位置的bit值
3. BITCOUNT：统计BitMap中值为1的数量
4. BITFIELD：操作（查询、修改、自增）BitMap中bit数组中指定位置（offset）的值 **(可以同时操作多个位)**
5. BITFIELD_RO: BITFIELD命令的变体，只有查询的操作
6. BITOP：将多个bitMap的结果做位运算(与、或、异或)
7. BITPOS：在指定范围内第一个0或者1出现的位置（从0开始）

## HyperLogLog

1. UV和PV的概念

   <img src="https://img.leftover.cn/img-md/202407040044057.png" alt="image-20240704004422954" style="zoom: 50%;" />

2. HyperLogLog的概念

`HyperLogLog` 是从LogLog算法派生的概率算法，用于确定非常大的集合的基数，而不需要存储其所有值。

Redis在的HLL是基于**string结构**实现的，且单个HLL的内存永远 < 16kb。**但是其测量结果是概率性的，有<0.81%的误差**，不过对于UV统计来说，完全可以忽略。

3. 命令
   - PFADD：向HyperLogLog中添加一个/多个元素（元素不重复）
   - PFCOUNT：返回HyperLogLog中的大概的数量（有误差）
   - PFMERGE：合并N个不同的HyperLogLog到一个里面



## 命令的参考手册

1. [官方手册](https://redis.io/docs/latest/commands/)
2. [中文手册](https://redis.com.cn/commands.html)





# Java Redis的三种客户端的比较

## Jedis

### 优点

1. api和redis的命令一致，容易上手，
2. 支持 pipelining、事务、LUA Scripting、Redis Sentinel、Redis Cluster等等 redis 提供的高级特性。

### 缺点

1. Jedis 在实现上是直接连接的 redis server，如果在多线程环境下是非线程安全的，这个时候可以使用连接池来管理Jedis，来解决多线程环境下线程不安全的问题
2. 采用了阻塞式IO（不支持异步编程），可能在高负载下出现性能瓶颈。

## Lettuce

### 优点

1. 线程安全
2. 支持同步编程，异步编程，响应式编程，自动重新连接，主从模式，集群模块，哨兵模式，管道和编码器等等高级的 Redis 特性
3. 如果不是执行阻塞和事务操作，如 BLPOP 和MULTI/EXEC 等命令，多个线程就可以共享一个连接，性能方面不会衰减

### 缺点

1. API更加抽象，学习使用成本高

## Redission

### 优点

1. 实现了分布式的特性和可扩展的数据结构。支持分布式锁、队列、信号量、集合等多种 Redis 基于对象的高级功能，适合分布式开发
2. 线程安全

### 缺点

1. 功能强大，但学习曲线较陡。

## 选择

**Jedis** 适合简单、同步的 Redis 操作，易于理解和使用。

**Lettuce** 适合需要高并发和异步操作的应用，提供更现代的编程模型。

**Redisson** 适合需要复杂分布式功能的应用，提供更高级的 Redis 操作抽象。

# Redis的基本使用

## 使用Jedis

1. 引入依赖

```xml
     <dependency>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
            <version>5.1.2</version>
        </dependency>
```

2. 配置redis连接池，以及基本使用

```java
@SpringBootTest
class JedisApplicationTests {
    private static Jedis jedis;

    private static JedisPoolConfig jedisPoolConfig = new JedisPoolConfig();
    private JedisPool jedisPool;

    static {
      //配置连接池
        jedisPoolConfig.setMaxTotal(8);
        jedisPoolConfig.setMaxIdle(8);
        jedisPoolConfig.setMinIdle(4);
        jedisPoolConfig.setMaxWait(Duration.ofMinutes(1));
    }

    @BeforeEach
    void setUp() {
//        jedis = new Jedis("localhost", 6379);
      // 使用连接池
        jedisPool = new JedisPool(jedisPoolConfig, "localhost", 6379);
        // 获取redis的连接
        jedis= jedisPool.getResource();

    }

    @Test
    public void testJedis() {
        jedis.select(1);
        jedis.set("name", "zwc");
        jedis.set("age", "100");
        jedis.incrBy("age", 2L);
    }

    @AfterEach
    void clear() {
        if (jedis != null) {
          //归还连接
            jedis.close();
        }
    }
}
```

## 使用Spring-Data—Redis

<img src="https://img.leftover.cn/img-md/202406240139215.png" alt="image-20240624013909785" style="zoom:50%;" />

1. 引入依赖

```xml
       <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

<!--        如果要使用redis的连接池的话，需要添加下面的这个依赖-->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-pool2</artifactId>
        </dependency>

<!--        序列化的依赖，若引入了spring-mvc，则不需要再手动引入jackson依赖-->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>

```

⚠️spring-data-redis默认底层使用的是`lettuce`，若需要使用`jedis`，则需要手动引入jedis的依赖，再在`application.yml`中配置`spring.data.redis.client-type`的值为`jedis`

2. 在`application.yml`中配置redis的相关信息，以及连接池的相关信息

```yml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      lettuce:
        pool:
          enabled: true
          # 最小空闲的连接数量
          min-idle: 0
          # 最大的连接数
          max-active: 8
          # 最大空闲的连接数
          max-idle: 4
          # 当连接池中的连接耗尽时，最大等待多长时间就抛出异常
          max-wait: 4000
        # 设置客户端的类型，默认为lettuce，若使用jedis，则需要引入jedis的依赖
      client-type: lettuce
```

3. 配置序列化方式

   spring-data-redis默认使用的是jdk的序列化，即使用`ObjectOutputStream`和`ObjectIputStream`，这种序列化方式可读性差，会加上很多无用的东西，导致浪费内存，因此我们会自己定义序列化方式，

   下面的配置的序列化方式：

   - key使用String的序列化方式（key一般是string，因此使用String的序列化方式即可，若key不一定为string，需采用其他的序列化方式）
   - value采用`jackson`来进行序列化和反序列化。（需引入`jackson-databind`的依赖）

```java
package leftover.springdataredis.config;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> getRedisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory);
//        设置key的序列化方式
        redisTemplate.setKeySerializer(RedisSerializer.string());
        redisTemplate.setHashKeySerializer(RedisSerializer.string());

        GenericJackson2JsonRedisSerializer jsonRedisSerializer = new GenericJackson2JsonRedisSerializer();
      
//设置value的序列化方式
        redisTemplate.setValueSerializer(jsonRedisSerializer);
        redisTemplate.setHashValueSerializer(jsonRedisSerializer);
        return redisTemplate;

    }
}

```

4. 使用

```java

    @Autowired
    RedisTemplate<String, Object> redisTemplate;


    @Test
    void testString() {
        ValueOperations<String, Object> valueOperations = redisTemplate.opsForValue();
        valueOperations.set("name", "hjhjh");
        Object name = valueOperations.get("name");
        System.out.println(name);


        valueOperations.set("user:100", new User("zwc777", 199));
        User user = (User) valueOperations.get("user:100");
        System.out.println(user);
    }

```

user序列化之后的结果

```json
{
    "@class": "leftover.springdataredis.pojo.User",
    "username": "zwc777",
    "age": 199
}
```

## 使用`StringRedisTemplate`

StringRedisTemplate 是 RedisTemplate的子类， 这个类默认`key` 、`value`、`hashKey`、`hashValue`都采用string的序列化方式

```java
    @Autowired
    StringRedisTemplate stringRedisTemplate;

    ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testStringRedisTemplate() throws JsonProcessingException {
        ValueOperations<String, String> valueOperations = stringRedisTemplate.opsForValue();
			//手动序列化
        String jsonStr = objectMapper.writeValueAsString(new User("zwc", 188));
        valueOperations.set("user:300", jsonStr);
				//手动反序列化
        String s = valueOperations.get("user:300");
        User user = objectMapper.readValue(s, User.class);
        System.out.println(user);
    }
```

# 缓存

## 缓存的作用

1. 对于一些经常访问的数据，我们可以将其放到redis中，这样业务应用在访问数据时，会先查询Redis中是否保存了相应的数据

- 若缓存中有相应的数据，称为`缓存命中`，则直接从Redis中取出数据返回。（Redis中的数据保存在内存中，性能好）

- 若缓存中没有相应的数据，称为`缓存缺失`，则需回源到数据库查询相应的数据，再将查询到的数据存入Redis中，以便之后的请求可以命中缓存。（需要回源到数据库，性能差）

  因此缓存可以用来提升网站的性能，尤其是高并发场景下的性能

2. 数据库通常是应用的瓶颈之一。使用Redis缓存可以减少对数据库的直接访问，从而减轻数据库的压力，提升整个系统的吞吐量和稳定性。

## 数据库中的数据更新时，如何处理缓存

### Cache aside Pattern（缓存旁路模式）

1. 更新缓存(**双写模式**)：数据库中的数据更新时，更新对应的缓存。
   - **优点：**下次访问可以直接命中缓存，不需要再查询数据库。
   - **缺点：**在高并发场景下，并发更新同一个值，容易导致缓存和数据库中的数据不一致；且如果对于某些缓存值的计算比较复杂，但是又不经常访问，这样缓存的利用率就比较低。
2. 删除缓存：数据库中的数据更新时，删除对应的缓存，下一次读取缓存时发生缓存缺失，再从数据库读取数据写回缓存（类似于懒加载的思想）。
   - **优点:**这样缓存中保留的是经常访问的热点数据
   - **缺点：**删除缓存后，之后的访问会触发一次缓存缺失，需要从数据库中取数据再写入缓存。（适用于读多写少的场景）

## 更新数据时缓存一致性问题

缓存一致性问题是指缓存中的数据和数据库中的数据存在不一致的情况。

![image-20240626160050937](https://img.leftover.cn/img-md/202406261600084.png)

### 双写模式

TODO：https://juejin.cn/post/7190400432294854711#heading-8

### **Cache aside Pattern**

如果是更新数据，就有先删缓存还是先更新数据库的区分（通常我们会选择`先更新数据库再删除缓存`）

从下图可以看出，无论是先更新数据库还是先删除缓存，都存在数据一致性的问题。

当采用`先更新数据库再删除缓存`的方法，但是在实际的业务中，发生这种情况的概率是很小很小的，因为数据库的写入通常要比缓存的写入的时间要长得多了，所以很难出现上述的情况，所以**概率很小的条件下，先更新数据库再删除缓存是可以接受的。**
 ![image-20240626170811516](https://img.leftover.cn/img-md/202406261708628.png)

**总结**：

- 如果选用先删除缓存再更新数据库的方案，那么在读＋写的并发操作下，依旧存在数据的不一致性（数据最终一致性），可以通过延迟双删的方式进行优化（延迟双删指先删除一次缓存，等更新完数据库后，延迟一会，再删除一次缓存），优化难点:这延迟一会就很控制。
- 选用先更新数据库再删除缓存的方案，在所有方案中更新数据时数据在缓存和数据库中的一致性效果是最好的，推荐使用该方案（先更新数据库再删除缓存）
- 但是先更新数据库再删除缓存的方案同样存在一些别的问题：如果更新完数据库后删除缓存的过程中出现了问题，此时便会导致缓存中的数据依旧是旧数据，数据库又是新数据，便会带来不一致性，说白了就是这两个操作不是原子操作，依旧会带来问题。
- ⚠️建议给缓存加上过期时间，这样即时出现缓存不一致的情况，缓存的数据也会很快过期，对业务还是能接受的。

如何解决原子性的问题：https://juejin.cn/post/7190400432294854711#heading-10

## 缓存穿透

用户请求的数据在缓存和数据库中都不存在，若有大量这样的请求，则会给数据库带来巨大的压力

**原因：**

- 业务误操作，缓存中的数据和数据库中的数据都被误删除了，所以导致缓存和数据库中都没有数据；
- 黑客恶意攻击，故意大量访问某些读取不存在数据的业务

**解决方法：**

- 第一种方案，非法请求的限制。在非法请求打入缓存之前，我们对请求对参数进行判断，看是否存在非法值，若存在则进行拦截，返回错误信息给前端

  

- 第二种方案，缓存空值或者默认值。 我们可以给这个不存在的key也缓存起来，value为`空字符串`或者`缺省值`（过期时间设置得短一点），这样后续的请求就可以从缓存中取出空值直接返回。

  - 缺点：造成额外的内存消耗，redis中会保存一些不存在的key

- 第三种方案，使用布隆过滤器快速判断数据是否存在，避免通过查询数据库来判断数据是否存在；若存在则继续后面的流程，若不存在则直接返回错误信息给前端。

  - 优点：速度快
  - 缺点：存在误判的可能，查询布隆过滤器说数据存在，并不证明数据库中一定存在这个数据，但是查询布隆过滤器说数据不存在，那么数据库中就一定不存在这个数据



## 缓存雪崩

什么是缓存雪崩？

   通常我们为了保证缓存中的数据与数据库中的数据一致性，会给 Redis 里的数据设置过期时间，当缓存数据过期后，用户访问的数据如果不在缓存里，业务系统需要重新生成缓存，因此就会访问数据库，并将数据更新到 Redis 里，这样后续请求都可以直接命中缓存。

   那么，当**大量缓存数据在同一时间过期（失效）或者 Redis 故障宕机**时，如果此时有大量的用户请求，都无法在 Redis 中处理，于是全部请求都直接访问数据库，从而导致数据库的压力骤增，严重的会造成数据库宕机，从而形成一系列连锁反应，造成整个系统崩溃，这就是**缓存雪崩**的问题。

### 解决 大量缓存数据在同一时间过期 的问题

1. 如果要给缓存数据设置过期时间，应该避免将大量的数据设置成同一个过期时间。我们可以在对缓存数据设置过期时间时，**给这些数据的过期时间加上一个随机数**，这样就保证数据不会在同一时间过期。

2. 当业务线程在处理用户请求时，**如果发现访问的数据不在 Redis 里，就加个互斥锁，保证同一时间内只有一个请求来构建缓存**（从数据库读取数据，再将数据更新到 Redis 里），当缓存构建完成后，再释放锁。未能获取互斥锁的请求，要么等待锁释放后重新读取缓存，要么就返回空值或者默认值。

   实现互斥锁的时候，最好设置**超时时间**，不然第一个请求拿到了锁，然后这个请求发生了某种意外而一直阻塞，一直不释放锁，这时其他请求也一直拿不到锁，整个系统就会出现无响应的现象。**（不适用高并发情况）**

3. 后台更新缓存

   业务线程不再负责更新缓存，缓存也不设置有效期，而是**让缓存“永久有效”，并将更新缓存的工作交由后台线程定时更新**。

   事实上，缓存数据不设置有效期，并不是意味着数据一直能在内存里，因为**当系统内存紧张的时候，有些缓存数据会被“淘汰”**，而在缓存被“淘汰”到下一次后台定时更新缓存的这段时间内，业务线程读取缓存失败就返回空值，业务的视角就以为是数据丢失了。

   解决上面的问题的方式有两种。

   第一种方式，后台线程不仅负责定时更新缓存，而且也负责**频繁地检测缓存是否有效**，检测到缓存失效了，原因可能是系统紧张而被淘汰的，于是就要马上从数据库读取数据，并更新到缓存。

   这种方式的检测时间间隔不能太长，太长也导致用户获取的数据是一个空值而不是真正的数据，所以检测的间隔最好是毫秒级的，但是总归是有个间隔时间，用户体验一般。

   第二种方式，在业务线程发现缓存数据失效后（缓存数据被淘汰），**通过消息队列发送一条消息通知后台线程更新缓存**，后台线程收到消息后，在更新缓存前可以判断缓存是否存在，存在就不执行更新缓存操作；不存在就读取数据库数据，并将数据加载到缓存。这种方式相比第一种方式缓存的更新会更及时，用户体验也比较好。

### 解决 Redis 故障宕机 的问题

**事前：**构建 Redis 缓存高可靠集群

​	如果 Redis 缓存的主节点故障宕机，从节点可以切换成为主节点，继续提供缓存服务，避免了由于 Redis 故障宕机而导致的缓存雪崩问题

**事中：**我们可以在业务服务中增加 `服务降级、熔断限流` 的机制，在 Redis 实例已经故障时，避免大量的请求打到数据库层。

一是对 Redis 的访问做资源隔离，在 Redis 故障时，进行`熔断`，不再访问Redis实例，直接返回预定义信息或错误信息，避免长时间阻塞占用应用资源，进而导致系统雪崩。待Redis恢复服务后，再将请求发送到Redis缓存。

二是对请求进行`限流`，在业务系统的请求入口控制每秒进入系统的请求数，避免过多的请求被发送到数据库，防止引发连锁的数据库雪崩，甚至是整个系统的崩溃。

**事后：**在 Redis 重启后，需要快速恢复数据，这就需要事前开启了Redis的 `AOF 和 RDB` 持久化机制。并且做好`定期备份`，防止 AOF 和 RDB 文件损坏或丢失

## 缓存击穿

我们的业务通常会有几个数据会被频繁地访问，比如秒杀活动，这类被频地访问的数据被称为热点数据。

如果缓存中的**某个热点数据突然过期**了，此时大量的请求访问了该热点数据，就无法从缓存中读取，直接访问数据库，数据库很容易就被高并发的请求冲垮，这就是**缓存击穿**的问题（也叫热点Key问题）。 缓存击穿问题和缓存雪崩问题很类似，可以认为缓存击穿问题是缓存雪崩问题的一个子集

### 解决方法

1. 互斥锁方案，保证同一时间只有一个业务线程更新缓存，未能获取互斥锁的请求，要么等待锁释放后重新读取缓存，要么就返回空值或者默认值。**（在缓存重建的时候会降低并发量）**
2. 不给热点数据设置过期时间，由后台异步更新缓存，或者在热点数据准备要过期前，提前通知后台线程更新缓存以及重新设置过期时间；





## Redis实现分布式锁

### 实现思路

1. 利用sex nx ex 获取锁，并设置过期时间（兜底的方案，如果程序中没有释放锁，时间到期了会自动释放），value为一个随机值（这里使用uuid+线程id）
2. 释放锁的时候先判断这个获取的value与当前自己的标识是否一致，一致才删除，不一致则说明这个锁不是自己的，则不删除（防止误删别人的锁）

3. 我们需要保证释放锁的时候的一个原子性，可以编写一个释放锁的lua脚本，Java中调用这个lua脚本来释放锁
4. 代码如下：

```java

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Service
public class Lock implements ILock {


    private static final String LOCK_PREFIX = "lock:";
    private String name;
    private StringRedisTemplate stringRedisTemplate;

    private final String ID_VALUE = UUID.randomUUID().toString(true) + Thread.currentThread().getId();

    private static DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();

    static {
        // 设置lua脚本
        redisScript.setLocation(new ClassPathResource("lua/lock.lua"));
    }

    @Override
  // 获取锁
    public boolean tryLock(long timeout) {
        Boolean lock = stringRedisTemplate.opsForValue().setIfAbsent(LOCK_PREFIX + name, ID_VALUE, timeout, TimeUnit.SECONDS);
        // 获取到锁
//        因为上述是包装类，所以如何直接return lock的话可能会返回一个null，然后自动拆箱的时候会出现异常
        return BooleanUtil.isTrue(lock);

    }
		//释放锁
    @Override
    public void unlock() {
        // 执行lua脚本， 只有相匹配的时候才会释放锁，防止释放别人的锁
        stringRedisTemplate.execute(redisScript, List.of(LOCK_PREFIX + name), ID_VALUE);
    }
}

```
释放锁的lua脚本

```lua

if (redis.call("get", KEYS[1]) == ARGV[1]) then
    return redis.call("del", key)
end
return 0

```

调用

```java
      // 传入过期时间
			boolean tryLock = lock.tryLock(1200);
//        没有获取到锁
        if (!tryLock) {
            return Result.fail("不能重复下单");
        }

//       获取到锁了
        try {
            IVoucherService currentProxy = (IVoucherService) AopContext.currentProxy();
//                返回订单id
            return currentProxy.createSecKillOrder(id, userId);
        } finally {
          // 释放锁
            lock.unlock();
        }

```

### 存在的问题

<img src="https://img.leftover.cn/img-md/202406271855243.png" alt="image-20240627185522114" style="zoom:50%;" />

### 解决不可重入的问题

<img src="https://img.leftover.cn/img-md/202406280043255.png" alt="image-20240628004327148" style="zoom:50%;" />

上述我们在redis中存的是字符串，要想实现可重入锁，可以采用hash结构，hkey 为当前线程的标识，hvalue为重入的次数。大概是这样的一个结构

<img src="https://img.leftover.cn/img-md/202406271857597.png" alt="image-20240627185713521" style="zoom:50%;" />

思路：

1. 在获取锁的时候，首先根据key判断锁是否存在，若不存在则表示当前线程没有获取到锁，使用hset 设置value

   ​			  若有这个key，则表示当前线程已经获取到锁了，再根据hkey（线程标识符）判断这个锁是不是自己的，

   ​										若是自己的，则使用hincyby命令将vlaue+1

   ​										若不是自己的，则表示获取锁失败，return

   <img src="https://img.leftover.cn/img-md/202406271913939.png" alt="image-20240627191337609" style="zoom:50%;" />

2. 释放锁的时候，判断锁是否还被自己持有，若不是，则直接return（说明过期了）

   ​								若是，则使用hincrby 将value–1，再判断是否>0 ，

   ​															若>0，则不能释放锁，
	​										      			  若<= 0,则释放锁
   ​    

   ![image-20240627191413076](https://img.leftover.cn/img-md/202406271914126.png)		

### 解决可重试问题

1. Redisson利用信号量和PubSub功能实现了锁的重试，在创建RedissonClient时，我们可以设置重试的时间

   当我们锁获取失败的时候，判断剩余的重试时间是否 >0.

   ​					若<= 0,则不会进行重试了，直接返回false（获取锁失败）

   ​					若 > 0 , 则会订阅锁释放的消息，当有锁释放时,会publish一条消息，此时会进行重新获取锁。重复这样的逻辑，直到剩余的					重试时间<=0

### 解决超时释放的问题（看门狗机制）

锁都设置了超时时间（以防止锁一直释放不掉，导致程序卡死，作为一种兜底的方案）。

当超过了有效时间，锁就自动释放了（即redis里面的数据过期了），有时候可能是因为业务计算量比较大导致的，而不是因为意外导致没有把锁释放掉。这时候锁释放掉是我们不想看到的，因此Redisson设置了一个看门狗的机制，原理就是设置一个定时器，每隔一段时间（有效时间/3=10s）就会重置超时时间。当锁释放时，会取消定时器。

<img src="https://img.leftover.cn/img-md/202406280043128.png" alt="image-20240628004356103" style="zoom: 67%;" />

### 解决主从一致性问题

发生的原因：

当redis搭建了主从集群，这时候主从同步存在延迟，这时候我们的一个线程获取到了锁，但是这时候主节点宕机了，锁的数据还没同步给从节点，之后会选举一个从节点作为主节点，这时候主节点中就没有锁的信息，其他线程就能获取到锁。

解决方法：

采用**联锁**的方式，我们可以部署多个redis节点（非主从关系），若需要保证高可用，可以为这些redis部署一个从节点。当获取锁的时候，需要从每个redis节点中都获取锁，只有每个redis节点的锁都获取成功，这个锁才获取成功。这样即使有某个redis节点挂了，其他的线程也不能获取到锁。

### 三种方案的优缺点

![image-20240628004648837](https://img.leftover.cn/img-md/202406280046895.png)

# Redis 实现消息队列

## List实现消息队列

可以使用LPUSH 和 BRPOP 来实现消息队列， 生产者使用LPUSH 往List中放消息，使用BRPOP从list中取出消息

优点：

- 使用的是Redis的数据结构，可以用Redis的持久化机制，数据安全有保证
- 可以满足消息的有序性

缺点：

- 只能读取一条消息，当同时有多个消息时，其他消息会丢失
- 只支持单消费者

## Pub/Sub 实现消息队列

使用Redis的`PSUBSCRIBE` 、`SUBSCRIBE` 来订阅频道， 使用`PUBLISH`来发布消息

优点：

支持多个生产者，多个消费者

缺点：

不支持数据持久化,如果出现网络断开、Redis 宕机等，消息就会被丢弃。

无法避免消息丢失

消息堆积有上限，超出时数据会丢失

## 基于Stream的消息队列

###  基本命令

#### XADD

向stream中添加message

```sh
XADD x1 * name zwc age 18
```



<img src="https://img.leftover.cn/img-md/202406290152976.png" alt="image-20240629015235882" style="zoom: 33%;" />



#### XREAD

从stream中读取消息,一个消息可以被多次读取

```shell
XREAD Block 0 Streams x1 0
```

<img src="https://img.leftover.cn/img-md/202406290156289.png" alt="image-20240629015619219"  />

####  XGROUP CREATE

<img src="https://img.leftover.cn/img-md/202406290235884.png" alt="image-20240629023528808" style="zoom:50%;" />

创建消费者组

```shell
XGROUP CREATE x1 g1 0 
```

创建一个名为g1的消费者组，从x1中读取消息（从头消费），若为 $ ,则表示从尾部开始消费，只接受新消息，当前 Stream 消息会全部忽略。

<img src="https://img.leftover.cn/img-md/202406290202309.png" alt="image-20240629020235226" style="zoom:50%;" />

#### XREADGROUP

多个消费者消费消息

有ack机制，保证消息至少被消费一次

可以阻塞读取

```shell
XREADGROUP Group g1 c1 block  0 Streams x1 0
```

<img src="https://img.leftover.cn/img-md/202406290205395.png" alt="image-20240629020502326" style="zoom:50%;" />

建议：正常情况我们使用 `>` 开始读取下一个未消费的消息

当redis宕机之后我们可以使用0 ,从pending-list中读取已消费但未确认的消息，之后再使用`>` 开始读取下一个未消费的消息





## 各种方案的比较

<img src="https://img.leftover.cn/img-md/202406290227852.png" alt="image-20240629022700778" style="zoom:50%;" />

# Feed流

Feed流产品一般有2种模式：

- Timeline：简单地按内容发布时间排序，常用语好友或者关注，例如朋友圈，twitter
- 智能排序：利用智能算法推送用户感兴趣的信息来吸引用户。例如抖音，快手等等

## Timeline模式

Timeline模式的实现方案有3种：

- 拉模式
- 推模式
- 推拉模式

### 拉模式

也叫做读扩散。简单来说就是每个用户发送的“动态”存放在一个地方（发件箱），用户想要读取它关注的列表的“动态”时，就从发件箱拉下来即可

### 推模式

也叫做写扩散。 简单来说就是我发了条“动态”，那么这条动态会存放在我的每一个粉丝的收件箱中，用户想要读取它关注的列表的“动态”时，从收件箱中读取即可

### 推拉结合模式

也叫做读写混合，兼具推和拉两种模式的优点。简单来说：

- 普通用户发的动态会被推送到他的所有粉丝收件箱中。
- 如果是大V，它的粉丝很多，那么他是直接将“动态”先写入到一份到发件箱里一份，然后再直接写一份到活跃粉丝收件箱里边去。

当用户想要读取它关注的列表的动态时，如果是活跃用户，那么大V和普通的人发的都会直接写入到自己收件箱里边来，直接从收件箱读取即可；而如果是普通的用户，由于他们上线不是很频繁，所以等他们上线时，再从发件箱里边去拉信息。

## 两种模式的比较

![image-20240629235317844](https://img.leftover.cn/img-md/202406292353085.png)

## 分页的方式

普通的分页 和滚动分页

### 普通分页的问题

在feed流中，使用普通的那种（根据排名）分页的方式，当粉丝在查看东西时，若此时其他博主发送了一条新的blog，这时候查询就会出现问题，会查询到一条上一次相同的数据

### 滚动分页

滚动分页是这一次查询是从上一次的最后一条数据开始查询，因此若突然其他博主发了一篇blog，也不会有影响

可以使用redis 的`ZREVRANGEBYSCORE` 命令实现

