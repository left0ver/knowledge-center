## JSR303

JSR303的注解：

**@NotNull**: 不能为Null

Null： 必须为null

**@AssertTrue**：必须为true

**@AssertFalse**：必须为false

**@Max**：设置最大值

**@Min**：设置最小值

**@Size**：确保字符序列、集合、数组的大小在指定范围内。

**@DecimalMin**：确保数值属性的值不小于指定的最小值（包括边界）

**@DecimalMax**：确保数值属性的值不大于指定的最大值（包括边界）。

**@Digits**：确保数值属性的整数部分和小数部分的位数在指定范围内。

**@Past**：确保日期属性的值为过去的日期。

**@PastOrPresent**：确保日期属性的值为过去或现在的日期。

**@Future**：确保日期属性的值为未来的日期。

**@FutureOrPresent**：确保日期属性的值为未来或现在的日期。

**@Pattern**：确保字符串属性符合指定的正则表达式。

**@Positive**：确保数值属性的值为正数。

**@PositiveOrZero**：确保数值属性的值为正数或零。

**@Negative**：确保数值属性的值为负数。

**@NegativeOrZero**：确保数值属性的值为负数或零。

**@Email**：确保字符串属性符合电子邮件地址格式。



**Hibernate Validator特有的注解：**

**@Length**：确保字符串属性的长度在指定范围内。

**@Range**：确保数值属性的值在指定范围内。

**@URL**：确保字符串属性符合URL格式

**@NotEmpty**：确保字符序列、集合、数组不为空。

**@NotBlank**：确保字符串属性非空白。

**@CreditCardNumber**：确保字符串属性符合信用卡号码格式。

**@EAN**：确保字符串属性符合EAN格式。

**@UniqueElements**：确保集合中的元素唯一。

**@CodePointLength**：确保字符串的字符数（以Unicode代码点计算）在指定范围内。

**@Currency**：确保字符串符合货币代码格式。

**@ISBN**：确保字符串属性符合ISBN格式

**@SafeHtml**：确保字符串属性仅包含安全的HTML内容。

**@ScriptAssert**：使用自定义的脚本语言（如SpEL、Groovy）进行复杂的验证逻辑。

@UUID：验证字符串是否符合UUID格式





## JSR310

springboot2以上不需要导入jackson 的那个包

mybatis在3.4.0以上不需要导入mybatis-typehandlers-jsr310（现在基本都不需要自己引入了）

```xml
		<-- 让Mybatis支持JSR310 -->
 		<dependency>
            <groupId>org.mybatis</groupId>
            <artifactId>mybatis-typehandlers-jsr310</artifactId>
            <version>1.0.2</version>
        </dependency>
         <-- 让SpringMVC支持JSR310 -->
        <dependency>
            <groupId>com.fasterxml.jackson.datatype</groupId>
            <artifactId>jackson-datatype-jsr310</artifactId>
            <version>2.9.7</version>
        </dependency>
```

###  @JsonFormat 注解

用于控制 `java.time` 对象在 JSON 中的格式（一般用于pojo类，使用jsckson序列化和反序列化json的时候会用到）

```java
@TableName(value = "user3")
@Data
public class User3 implements Serializable {
    @TableId(type = IdType.AUTO)
    private Integer userId;
    private String username;
    private Integer age;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
    private static final long serialVersionUID = 1L;
}
```

### @DateTimeFormat

**`@DateTimeFormat`**: 用于控制 `java.time` 对象在 Spring MVC 请求/响应中的格式。（一般用于controller中）

```java

@RestController
public class User3Controller {

    @Autowired
    User3Mapper user3Mapper;

    @PostMapping("/user3")
    public ResponseEntity createUser3(@RequestBody User3 user3, @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") @RequestParam("usedTime") LocalDateTime usedTime) {
        System.out.println(usedTime);
        System.out.println(user3);
        user3Mapper.insert(user3);
        return ResponseEntity.ok(LocalDateTime.now());
    }
}

```

### `@JsonDeserialize`

- **用途**：指定自定义的反序列化器，用于将 JSON 字符串转换为 java 对象
- **属性**：
  - `using`：指定反序列化器类。

```java
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import java.time.LocalDate;

public class Event {
    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate eventDate;

    // Getter and setter
    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }
}
```

### `@JsonSerialize`

- **用途**：指定自定义的序列化器，用于将 Java对象 转换为 JSON 字符串。



## JSR 250

### @Resource

### @PostContruct

`@PostConstruct` 方法在对象实例化和依赖注入之后，但在对象的其他方法（如业务方法）被调用之前执行。

可以用于初始化bean之后加载一些数据，用于初始化资源或配置，如** 数据库连接、启动线程、查必需的属性是否已正确配置、从数据库或文件加载初始数据到缓存中。*

### @PreDestory

`@PreDestroy` 用于在对象销毁之前执行清理逻辑，如关闭数据库连接、停止线程、清除缓存

```java

    @PostConstruct
    public void init() {
        log.info("user3-controller初始化完成");
    }


    @PreDestroy
    public void destroy() {
        log.info("user-controller准备销毁");
    }

```

