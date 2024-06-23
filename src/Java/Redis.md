# Redis安装

## Mac上下载redis

```shell
brew install redis
```

配置文件位于`/opt/homebrew/etc/redis.conf`



Redis 可视化管理工具

[Another Redis Desktop Manager](https://github.com/qishibo/AnotherRedisDesktopManager/blob/master/README.zh-CN.md)



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
