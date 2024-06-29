### Mybatis中对事务的管理

```xml
  <transactionManager type="jdbc">
    			//连接关闭时不会自动提交
                <property name="skipSetAutoCommitOnClose" value="true"/>
   </transactionManager>
```

在 MyBatis 中有两种类型的事务管理器（也就是 type="[JDBC|MANAGED]"）：

- jdbc：mybatis会使用原生的JDBC代码去管理事务，默认情况下是开启事务了（即关闭了自动提交）

  ​      默认情况下mybatis会在连接关闭时自动提交，对于某些驱动程序来说，启用自动提交不仅是不必要的，而且是一个代价高昂的操作，可以设置			      `skipSetAutoCommitOnClose`为true（连接关闭时不会自动提交）（3.5.10之后，这在某些数据库连接池中是有用的，因为一些连接池在连接关闭时不允许改变autoCommit设置，否则可能会抛出异常。）

- MANAGED：mybatis不再负责事务的管理，把事务交给其他容器来负责，例如spring。（⚠️若单纯只有在mybatis的情况下，配置为MANAGED，则没人管理事务，则事务没有被开启）

```java
//设置为true，则表示启动自动提交，不开启事务
SqlSession sqlSession = factory.openSession(true);
```



## ${} 与#{} 的区别

1. #{}: 先编译sql，再给占位符传值，底层是PreparedStatment实现，可以防止sql注入，比较常用
2. ${}: 先进行sql语句拼接，再编译sql语句，底层是statement实现，存在sql注入现象，只有在需要进行sql语句关键字`（例如表名、升降序等等）`拼接的情况下会用到
3. 优先使用#{}，只有再${}实在实现不了的情况下使用\${}

## 模糊查询 like

```sql
select * from t_car where brand like '%奔驰%';

# mybatis里面的sql
  select *
        from t_car
# concat 是mysql里面的一个函数        
        where brand like concat("%", #{brand}, "%");
```





## 获取生成的主键值

`useGeneratedKeys="true"` 设置自动生成主键 ， keyProperty="xxxx" 将生成的主键绑定到对象的xxx属性上

```xml
    <insert id="carInsert2" useGeneratedKeys="true" keyProperty="id">
        insert into t_car
        values (#{id}, #{carNum}, #{brand}, #{guidePrice}, #{produceTime}, #{carType});
    </insert>
```



```java
        SqlSession sqlSession = SqlSessionUtil.getSqlSession();
        Car car = new Car(null, "1009", "比亚迪", 17.8, "2009-09-08", "电车");
//打印出的car有生成的id
        sqlSession.insert("carInsert2", car);
        System.out.println(car);
```



## Mybatis 的配置文件

### mapper标签

  resource:从类的类的跟路径下查找资源，配置文件需要放到类路径中

  url：需要提供一个绝对路径，配置文件可以存放在磁盘的任意位置，（不推荐，可移植性太差了）

  class：提供一个mapper接口的全类名 ，假设指定的是 pojo/Account ，那么mybatis会在pojo目录下查找Account.xml文件

```xml
<mappers>
	<mapper resource="mapper/accountMapper.xml"/>
	<mapper url=""/>
	<mapper class="" />
</mappers>
```

### package 标签

指定一个包名，mybatis会自动在这个包下找对应的配置文件，xml文件名必须和接口名字一样，否则会报错 （⚠️Mapper配置文件要和Mapper的接口文件在同一个包名下）

```xml
<mappers>
  <!-- Mapper配置文件要和Mapper的接口文件在同一个包名下-->
   <package name=""/>
</mappers>
```



### 开启全局懒加载

1. 懒加载可以提升性能，当开启时，所有关联对象都会延迟加载（即只有用到的时候才会加载，即只有用到的时候才会执行sql语句把对象加载到内存）
2. 若某个关联对象不需要懒加载 ，可以使用fetchType="eager"关闭单个对象的懒加载

```xml
    <setting name="lazyLoadingEnabled" value="true"/>
```





### typeAliases

⚠️ namespace 不能使用别名，必须写全限定接口名

```xml
    <typeAliases>
      <!-- 若alias 省略，则别名默认为类名简称-->
<!--        <typeAlias type="pojo.Account" alias="Account"/>-->
      
      <!-- 对这个包下的所有的类自动起别名，别名就是类名简称，不区分大小写-->
        <package name="pojo"/>
    </typeAliases>
```

### mapUnderscoreToCamelCase属性

⚠️前提：需要遵守Java的命名规范以及数据库列名遵守sql的命名规范
Java属性命名规范：驼峰命名方式
sql的命名规范：全部小写，单词之间使用`_`（隔开）

```xml
<!--        是否开启驼峰命名自动映射-->
    <setting name="mapUnderscoreToCamelCase" value="true"/>
```





### sql标签和inclue标签

1. sql标签用来定义可以复用的sql片段

```xml
   <!--使用的时候要传入table属性具体的值 -->  
	<sql id="Base_Column1">
        ${table}.id,${table}.name,${table}.age,
    </sql>

    <sql id="Base_Column2" >
      <!--引用其他sql片段 -->
        <include refid="${include_target}">
           <!--传值 -->
            <property name="table" value="${table}"/>
        </include>
        ${table1}.birth, ${table1}.sex
    </sql>

<select id="selectByChoose" resultMap="StudentResultMap">
        select
  					  <!--引用其他sql片段 -->
            <include refid="Base_Column2">
               <!-- 传入该sql片段所需要的值-->
                <property name="include_target" value="Base_Column1"/>
                <property name="table1" value="student"/>
                <property name="table" value="student"/>
            </include>

        from student
        <where>
            <choose>
                <when test="age!=null">age > #{age}</when>
                <when test="name!=null and name!=''">name like "%"#{name}"%"</when>
                <otherwise>id = #{id}</otherwise>
            </choose>
        </where>
    </select>

 <!-- 最后生成的结果-->
select student.id,student.name,student.age, student.birth, student.sex from student WHERE id = ?
```



## 动态sql

### if、where 标签

1. 若if语句中test表达式中的值为true，则会把if语句中的内容拼接上去

   ⚠️test属性中可以使用的内容：

     当使用了@Param注解，那么test中要出现的是@Param注解指定的参数名

     没有使用@Param注解 ，nametest中要出现的是param1，param2 ，arg0，arg1. . .

     当使用了pojo，那么test中出现的是pojo类的属性名

2. Where 标签的作用： 

   - 当所有条件都为false时，where标签不会生成where子句
   - 自动去除某些条件`前面`多余的and 或者or（⚠️只能去除前面的多余的and 或者 or）
   - where标签等价于 `<trim prefix="where" prefixOverrides="and|or"> </trim>`

```xml
    <select id="selectByDynamicCondition" resultMap="StudentResultMap">
        select *
        from student
      	<where>
            <if test="age!=null">
                age > #{age}
            </if>
            <if test="name!=null and name!=''">
                and name like "%"#{name} "%"
            </if>
       </where>

    </select>
```

### set标签（用于update语句）

1. 和where标签类似，set标签会动态地在行首插入 SET 关键字，并会末尾删掉额外的逗号
2. 等价于 `<trim prefix="set" suffixOverrides=","> </trim>`

```xml
 <update id="updateByDynamicCondition" parameterType="student" >
      update student
      <set>
          <if test="age!=null">
              age =#{age},
          </if>
          <if test="name!=null and name!=''">
              name =#{name},
          </if>
     </set>

      where id =#{id}
  </update>
```

### choose、when、otherwise

1. choose、when、otherwise 一般是结合起来使用，`类似于switch语句` ，choose标签中的内容只有一条会被添加到sql中
2. 会依次判断when语句的test表达式是否为true，若为true，则将语句拼接上去（之后的when不会再判断），若所有的when都为false，则将otherwise中的语句拼接进行

```xml
    <select id="selectByChoose" resultMap="StudentResultMap">
        select *
        from student
        <where>
            <choose>
                <when test="age!=null">age > #{age}</when>
                <when test="name!=null and name!=''">name like "%"#{name}"%"</when>
                <otherwise>id = #{id}</otherwise>
            </choose>
        </where>
    </select>
```

### foreach

```xml
<!--    批量更新-->
    <insert id="insertBatch" parameterType="student" >
        insert into student values
        <foreach collection="students" item="student" separator=",">
            (#{student.id}, #{student.name} ,#{student.age} ,#{student.birth},#{student.sex})
        </foreach>

    </insert>

<!--    批量删除-->
    <delete id="deleteByIdBatch" parameterType="long">
        delete from student where id in
      <!--若mapper接口的方法参数使用了@Param注解，collection填 @Param注解的值，否则 填param1，param2 或者arg0，arg1 或者 数组填 array，集合填list，map-->
      <!--item指的是每个元素的名称 ，可以在foreach标签里面使用，-->
      <!--separator 分隔符，例如这里的分隔符是, 则最终形成的结果类似 ： id1 , id2 ,id3  -->
      <!-- open是foreach代码块之前添加的字符-->
       <!-- close是foreach代码块之后添加的字符-->
        <foreach collection="ids" item="id" separator="," open="(" close=")">
            #{id}
        </foreach
```

## Mybatis进行crud

### insert

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="1132">

<!--#{}里面填的是map的key，插入的值是对应map的value，若key不存在，get返回的是null所以插入的是null-->
<!-- ⚠️注释不能写在insert语句里面，只能写在外面   -->
    <insert id="carInsert1">
        insert into t_car values (null, #{carNum}, #{brand}, #{guidePrice}, #{produceTime}, #{carType})
    </insert>

<!--    使用pojo类插入 ， #{} 里面填的是get方法去掉get，首字母小写（一般填属性名即可）-->
  <!-- ⚠️定义pojo类的时候，最好使用包装类，因为原始类型不能为null-->
    <insert id="carInsert2">
        insert into t_car
        values (#{id}, #{carNum}, #{brand}, #{guidePrice}, #{produceTime}, #{carType});
    </insert>
</mapper>
```

```java
 @Test
    public void testInsertWithMap() {
        SqlSession sqlSession = null;
        try {
            sqlSession = SqlSessionUtil.getSqlSession();
            Map<String, Object> map = new HashMap<>();
            map.put("carNum", 1005);
            map.put("brand", "比亚迪");
            map.put("guidePrice", 15.5);
            map.put("produceTime", "2002-01-09");
            map.put("carType", "电车");
            sqlSession.insert("carInsert1", map);
            sqlSession.commit();
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            sqlSession.close();
        }
    }


    @Test
    public void testWithPojo() {
        SqlSession sqlSession = SqlSessionUtil.getSqlSession();
        Car car = new Car(null, "1009", "比亚迪", 17.8, "2009-09-08", "电车");
        sqlSession.insert("carInsert2", car);
        sqlSession.commit();
        sqlSession.close();
    }
```

### select

select语句需要在xml配置文件中指定resultType的类型，⚠️因为数据库中字段的命名规则和Java的属性的命名规则不一致，因此低版本的mybatis可能需要使用as重命名列的名称（如下，高版本的不需要）

```xml
    <select id="selectOne" resultType="leftover.使用mybatis做简单crud.pojo.Car">
        select id, car_num as carNum, brand, guide_price , produce_time as produceTime, car_type as carType
        from t_car
        where id = #{id}
    </select>
```

## @MapKey注解

`@MapKey`注解在MyBatis中用于指定返回结果为`Map`类型时，如何选择结果集中的某一列作为Map的key。它使得可以轻松地将查询结果映射到一个Map中，从而便于按指定的key进行访问和操作

```java
			//将查询结果的name属性作为map集合的key
    @MapKey("name")
    Map<String ,Student> selectAllForOneMap();
```





## resultMap（设置数据库字段与Java pojo类的属性的映射关系）

```xml
<!--    设置数据库表的字段与Java pojo的属性的映射-->
<!--    id ： 设置一个resultMap的id  -->
<!--    type： pojo类的全限定类名或者类型别名-->
    <resultMap id="StudentResultMap" type="Student">
        <id property="id" column="id" jdbcType="BIGINT" javaType="long"/>
        <result property="name" column="name" jdbcType="VARCHAR" javaType="string"/>
        <result property="age" column="age" jdbcType="INTEGER" javaType="int"/>
        <result property="birth" column="birth" jdbcType="DATE" javaType="date"/>
        <result property="sex" column="sex" jdbcType="CHAR" javaType="char"/>
    </resultMap>

			<!--使用的时候指定resultMap的id即可 -->
		<select id="selectAllForOneMap" resultMap="StudentResultMap">
        select *
        from student
    </select>
```





## 高级映射

### 多对一 （多的一方为主表，一的一方为副表）

```java
@Data
public class TStu implements Serializable {
    private Integer sid;
    private String sname;
    private  TClazz clazz;
    private static final long serialVersionUID = 1L;
}

@Data
public class TClazz implements Serializable {
    private Integer cid;

    private String name;


    private static final long serialVersionUID = 1L;
}
```

```xml
   	<!-- TStuMapper.xml-->
		<!--   多对一映射 第一种 ，级联属性映射-->
    <resultMap id="StuResultMap" type="leftover.pojo.TStu">
        <id property="sid" column="sid" jdbcType="INTEGER" javaType="int"/>
        <result property="sname" column="sname" jdbcType="VARCHAR" javaType="string"/>
        <result property="clazz.cid" column="cid" jdbcType="INTEGER" javaType="int"/>
        <result property="clazz.name" column="name" jdbcType="VARCHAR" javaType="string"/>
    </resultMap>

    <select id="getAllBySid" resultMap="StuResultMap">
        select stu.sid, stu.sname, clazz.cid, clazz.name
        from t_stu stu
                 join t_clazz clazz on stu.cid = clazz.cid
        where stu.sid = #{sid}
    </select>

    <!--  第二种方式，association ，这种方式相比于第一种方式更加地清晰,算是第一种方式的改写吧-->
    <resultMap id="StuResultMapAssociation" type="leftover.pojo.TStu">
        <id property="sid" column="sid" jdbcType="INTEGER" javaType="int"/>
        <result property="sname" column="sname" jdbcType="VARCHAR" javaType="string"/>
        <!--        property是要映射的pojo类的属性名 javaType：指定要映射的Java类型，全类名或者别名-->
        <association property="clazz" javaType="tClazz">
            <id property="cid" column="cid"/>
            <result property="name" column="name"/>
        </association>

    </resultMap>

		 <select id="getAllBySidAssociation" resultMap="StuResultMapAssociation">
        select stu.sid, stu.sname, clazz.cid, clazz.name
        from t_stu stu
                 join t_clazz clazz on stu.cid = clazz.cid
        where stu.sid = #{sid}
    </select>

  <!-- 第三种：两条sql，完成多对一的分步查询  -->
	<!-- 优点：复用性增强，可以重复利用 。 可以充分使用他们的懒加载机制 -->
    <resultMap id="stuResultMap" type="leftover.pojo.TStu">
        <id property="sid" column="sid" jdbcType="INTEGER" javaType="int"/>
        <result property="sname" column="sname" jdbcType="VARCHAR" javaType="string"/>
        <!--    property是要映射的pojo类的属性名 ，select填写的是第二步sql的id（命名空间+id) ,column是student表中的字段名（外键，例如address_id）,fetchType指定是否懒加载，lazy为懒加载，eager为不懒加载 -->
        <association property="clazz" select="leftover.mapper.TClazzMapper.getAllByCid" column="cid" fetchType="lazy"/>
    </resultMap>

    <select id="getAllBySidAssociationStep1" resultMap="stuResultMap">
        select sid, sname, cid
        from t_stu
        where sid = #{sid};
    </select>

```

```xml

<!-- TClazzMapper.xml-->
<resultMap id="clazzResultMap" type="leftover.pojo.TClazz">
        <id property="cid" column="cid" jdbcType="INTEGER"/>
        <result property="name" column="name" jdbcType="VARCHAR"/>
    </resultMap>

    <select id="getAllByCid" resultMap="clazzResultMap">
        select cid, name
        from t_clazz
        where cid = #{cid}
    </select>
```

### 一对多（一为主表，多为副表）

```xml

<!--    一对多 ，一为主表 ，多为副表-->
<!-- 第一种方式-->
    <resultMap id="clazzResultMapCollection" type="tClazz">
        <id property="cid" column="cid" jdbcType="INTEGER"/>
        <result property="name" column="name" jdbcType="VARCHAR"/>
        <!--   property是Java pojo类中的属性名   ofType指定集合中元素的类型  -->
        <collection property="stus" ofType="tStu">
            <id property="sid" column="sid" jdbcType="INTEGER" javaType="int"/>
            <result property="sname" column="sname" jdbcType="VARCHAR" javaType="string"/>
        </collection>
    </resultMap>
    
    <select id="getAllStudentByCid" resultMap="clazzResultMapCollection">
        select t_clazz.cid, t_clazz.name, t_stu.sid, t_stu.sname
        from t_clazz
                 join t_stu on t_clazz.cid = t_stu.cid
        where t_clazz.cid = #{cid}
    </select>


  <!--    第二种方式-->
    <resultMap id="clazzResultMapStep" type="tClazz">
        <id property="cid" column="cid" jdbcType="INTEGER"/>
        <result property="name" column="name" jdbcType="VARCHAR"/>
        <!--      column对应的是第一步查询处理的字段的名称，例如下面查询出来的字段名是cid_1,
        select 是第二步的select语句的id（命名空间+id），要返回一个list
        -->
        <collection property="stus" column="cid_1" select="leftover.mapper.TStuMapper.selectByCid"/>
    </resultMap>
    <select id="getAllStudentByCidStep" resultMap="clazzResultMapStep">
        select cid as cid_1, name
        from t_clazz
        where cid = #{cid}
    </select>

```

```java
@Data
public class TStu implements Serializable {
    private Integer sid;
    private String sname;
    private Integer cid;
    private TClazz clazz;
    private static final long serialVersionUID = 1L;
}


@Data
public class TClazz implements Serializable {
    private Integer cid;

    private String name;
    private List<TStu> stus;

    private static final long serialVersionUID = 1L;
}
```





##  缓存

1. 通过减少IO的方式，来提高程序的执行效率

2. mybatis的缓存：将select语句的查询结果放到缓存（内存）中，下一次还是这条select语句的话，直接从缓存中取，不再查数据库，一方面减少了IO，另一方面不再执行繁琐的查找算法，效率大大提升
3. `缓存只针对select语句`

4. mybatis缓存包括：
   - 一级缓存：将查询到的数据存储到sqlSession中
   - 二级缓存：将查询到的数据存储到sqlSessionFactory中
   - 或者集合其他第三方的缓存：比如EhCache（Java语言开发）、Memcache（C语言开发的）

### 一级缓存 （无需配置、默认开启）

```xml
<setting name="localCacheScope" value="SESSION"/>  默认为session，即在sqlsession会话中开启缓存
```



1. 不是同一个sqlSession对象或者查询的sql语句不同，都不会走缓存
2. 执行了SqlSession.clearCache（）方法或者执行了insert、delete、update语句都会`清空`一级缓存

### 二级缓存

- 使用二级缓存
  1. mybatis-config.xml 文件中配置`<setting name="cacheEnabled" value="true"/>` ，（不配置也行，默认为true）
  2. 在需要使用缓存的sqlMapper.xml文件中添加配置<cache/>
  3. 使用二级缓存的实体类对象必须是可序列化的，也就是必须实现Serializable接口
  4. 二级缓存是事务性的。这意味着，当 SqlSession 完成并提交时(commit)，或是完成并回滚(rollback)， flushCache=true的insert/delete/update 语句时（insert/delete/update的flushCache默认为true，select可以手动设置），缓存会获得更新。由于调用SqlSession.close方法时会自动commit，因此调用SqlSession.close方法时也会更新缓存

- flushCache=true，只要该sql语句被调用，都会导致本地缓存和二级缓存被清空，默认值：（对 insert、update 和 delete 语句）true
```xml
<select  flushCache="true"> </select>
```
- cache标签
```xml

<cache size="" flushInterval="" readOnly="" eviction="" />
<!--    size：缓存的大小-->
<!--    eviction 配置清除缓存的策略（默认LRU） ，当缓存数量超过设置的size时，会从缓存map中移除一些缓存
LRU – 最近最少使用：移除最长时间不被使用的对象。
FIFO – 先进先出：按对象进入缓存的顺序来移除它们。
SOFT – 软引用：基于垃圾回收器状态和软引用规则移除对象。
WEAK – 弱引用：更积极地基于垃圾收集器状态和弱引用规则移除对象。-->

<!--flushInterval 二级缓存刷新的间隔    -->
<!--    readOnly： true告诉mybatis这个数据是为只读的，你不要考虑安全问题
                   false则表示数据不是只读的，会（通过序列化）返回缓存对象的拷贝，速度会慢一些，但是更安全
       因为在多线程环境下只要涉及多个线程写操作就会有读错的风险，如果是只读的对象，那么就不会有读错数据的问题，
       这样mybatis就可以不需要考虑线程安全问题，只用考虑性能
-->


```

## 使用pageHelper插件



```xml
<!--mybatis-config.xml --> 
		<plugins>
        <!-- com.github.pagehelper为PageHelper类所在包名 -->
        <plugin interceptor="com.github.pagehelper.PageInterceptor">
        </plugin>
    </plugins>
```

配置了之后就正常写sql，然后在需要使用分页的sql前面开启分页，之后再移除分页即可

```java
    @Test
    public void testSelectByPageHelper() {
        SqlSession sqlSession = SqlSessionUtil.getSqlSession();
        StudentMapper studentMapper = sqlSession.getMapper(StudentMapper.class);
        int pageNum = 2;
        int pageSize = 2;
//    开启分页
        PageHelper.startPage(pageNum, pageSize);
//        返回的结果中是分页之后的数据
        List<Student> students = studentMapper.selectByPageHelper();

//        navigatePages 导航页面的数量（默认为8） pageInfo中存储了分页的很多其他信息
        PageInfo<Student> pageInfo = new PageInfo<>(students, 10);

        students.forEach(System.out::println);
        System.out.println(pageInfo);
      //移除分页
        PageHelper.clearPage();
    }
```



## discriminator（鉴别器）

MyBatis 鉴别器（Discriminator）是一种根据查询结果中的某个字段值动态选择不同映射的机制。它通常用于处理表的继承结构或根据某个字段的值动态决定对象类型的情况（`多用于继承的场景下`）

```java


@Data
public class User {
    private Integer userId;

    private String username;

    private String type;

}

@Setter
@Getter
public class AdminUser extends User {
    private Integer adminLevel;
}
```

数据库的字段

<img src="https://img.leftover.cn/img-md/202405220138217.png" alt="image-20240522013820046" style="zoom:33%;" />

```xml
 
<!--UserMapper.xml -->
<resultMap id="UserResultMap" type="user">
        <id property="userId" column="user_id" jdbcType="INTEGER"/>
        <result property="username" column="username" jdbcType="VARCHAR"/>
        <result property="type" column="type" jdbcType="VARCHAR"/>
        <!--        <discriminator javaType="string" column="type" jdbcType="VARCHAR">-->
        <!--            <case value="admin" resultType="leftover.pojo.AdminUser">-->
        <!--                <result property="adminLevel" column="admin_level" jdbcType="INTEGER"/>-->
        <!--            </case>-->
        <!--        </discriminator>-->
        <discriminator javaType="string" jdbcType="VARCHAR" column="type">
            <case value="admin" resultMap="userAdminMap"/>
        </discriminator>
    </resultMap>
    <!--extends 继承自UserResultMap ，即当你的sql语句使用了这个resultMap时，最终的resultMap的效果是
    会将UserResultMap和userAdminMap拼接起来
   ⚠️ 但是如果没有extends，则只会有一个adminLevel字段
   因此这个一般与discriminator一起使用
    -->
    <resultMap id="adminUserMap" type="leftover.pojo.AdminUser" extends="UserResultMap">
        <result property="adminLevel" column="admin_level" jdbcType="INTEGER"/>
    </resultMap>


    <select id="getUserByUserId" resultMap="UserResultMap">
        select *
        from user
        where user_id = #{userId}
    </select>
```

```java
//测试方法
    @Test
    public void testGetUserByUserId() {
        SqlSession sqlSession = SqlSessionUtil.getSqlSession();
        UserMapper userMapper = sqlSession.getMapper(UserMapper.class);
      
        User adminUser = userMapper.getUserByUserId(2);
        User user = userMapper.getUserByUserId(1);
      
        System.out.println(adminUser.getClass()); //UserAdmin
        System.out.println(user.getClass()); //User
        System.out.println(adminUser.getUserId()); //2
        System.out.println(adminUser.getUsername()); //1

    }
```



## mybatis 源码解析

1. 首先使用Javassist的`ProxyFactory`类动态生成一个实现了dao层的接口的代理类，对接口上进行劫持
2. 用户使用返回之后的代理对象调用方法时，mybatis通过配置文件获取到是哪种sql，例如是select语句，还会根据方法的返回值类型判断是 查询一条还是查询多条 ，从而决定调用` sqlSession.selectOne();` 还是`sqlSession.selectList()`方法，然后传入对应的参数，id是`接口名.方法名`, sql的参数会根据你调用方法时传入的参数 再结合 sql语句的对应的#{}里面的做匹配，转化为一个map集合传入（多参数）或者直接传入（单个参数）。

3. 如何将传入的参数转为map集合（多个参数时）

   ```java
    public Object getNamedParams(Object[] args) {
      //names是一个map<Integer,String>集合，{0:第一个参数的参数名 ，1:第二个参数的参数名} ，例如{0:username ,1: age}
           int paramCount = this.names.size();
           if (args != null && paramCount != 0) {
             //没有map注解且参数个数只有一个
               if (!this.hasParamAnnotation && paramCount == 1) {
                 //获取到参数值
                   Object value = args[(Integer)this.names.firstKey()];
                 //大多数情况下都是直接返回参数值
                   return wrapToMapIfCollection(value, this.useActualParamName ? (String)this.names.get(0) : null);
               } else {
                 //若有Params注解
                 // 最后的map结果（要传入的map集合）
                   Map<String, Object> param = new MapperMethod.ParamMap();
                 
                   int i = 0;
   							//遍历name集合
                   for(Iterator var5 = this.names.entrySet().iterator(); var5.hasNext(); ++i) {
                       Map.Entry<Integer, String> entry = (Map.Entry)var5.next();
                     // entry.getValue()是参数的名称 ，args[(Integer)entry.getKey()] 获取到真正传入的参数值
                       param.put((String)entry.getValue(), args[(Integer)entry.getKey()]); 
                     //设置通用的参数名 param1 ，param2
                       String genericParamName = "param" + (i + 1);
                     //没有这个通用的参数名就设置
                       if (!this.names.containsValue(genericParamName)) {
                           param.put(genericParamName, args[(Integer)entry.getKey()]);
                       }
                   }
   
                   return param;
               }
           } else {
               return null;
           }
       }
   ```

   
