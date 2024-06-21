# JSR303

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



## 全局异常处理

Spring6.1中，新的内置方法验证引发的 `HandlerMethodValidationException` 公开了一个 `Visitor` API，用于按 Controller 方法参数类型（如 @`RequestParameter`、`@PathVariable` 等）处理验证错误。

使用`@Validated()`注解检验则抛出`MethodArgumentNotValidException`

使用`@Valid`注解检验抛出`HandlerMethodValidationException`,对@RequestParms上的参数检验也是抛出`HandlerMethodValidationException`

```java
@RestControllerAdvice
public class GolbalExceptionHander {
  // 对MethodArgumentNotValidException进行处理
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResultData handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        BindingResult bindingResult = ex.getBindingResult();
        Map<String, Object> data = new HashMap<>();
        if (bindingResult.hasErrors()) {
            String errMessage = bindingResult.getAllErrors().stream().map((SFunction<ObjectError, String>) DefaultMessageSourceResolvable::getDefaultMessage).collect(Collectors.joining(";"));
            data.put("errMessage", errMessage);
        }
        return new ResultData(400, data);
    }

  // 对HandlerMethodValidationException进行处理
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResultData HandlerMethodValidationException(HandlerMethodValidationException ex) {
        Map<String, Object> data = new HashMap<>();
        if (ex.hasErrors()) {
            String errMessage = ex.getAllErrors().stream().map((SFunction<MessageSourceResolvable, String>) MessageSourceResolvable::getDefaultMessage).collect(Collectors.joining(";"));
            data.put("errMessage", errMessage);

        }
        return new ResultData(400, data);
    }
}

```

## 分组检验

1. 首先在实体类中指定检验规则对应的分组

   若没指定则属于`Default`分组

```java
@TableName(value = "user3")
@Data
public class User3 {
    @TableId(type = IdType.AUTO)
    @Null(groups = {Crud.Create.class}, message = "新增时userId必须为空")
    @NotNull(groups = {Crud.Delete.class, Crud.Update.class, Crud.Query.class}, message = "userId不能为空")
    private Integer userId;

    @NotNull(groups = Crud.Create.class, message = "username不能为空")
    @NotBlank
    private String username;

    @NotNull(groups = Crud.Create.class, message = "age不能为空")
    @Range(min = 0L, max = 200L)
    private Integer age;


    @Phone
    @NotBlank(groups = {Crud.Create.class}, message = "手机号不能为空")
    private String phone;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
```

2. 创建分组的接口（标记接口）

```java
// vaild 分组的标记接口
public interface Crud extends Default {
    interface Create extends Crud {

    }

    interface Update extends Crud {

    }

    interface Query extends Crud {

    }

    interface Delete extends Crud {

    }

}
```

3. 在检验的时候指定分组即可

```java
    @PostMapping("/user3")
    public ResponseEntity createUser3(
      // 指定检验的分组
        @Validated(value = {Crud.Create.class}) @RequestBody User3 user3) {
        user3Mapper.insert(user3);
        return ResponseEntity.ok(LocalDateTime.now());
    }
```

## 自定义检验

这里演示一个对手机号进行自定义检验的例子

1. 定义检验的注解

```java
@Target({METHOD, FIELD, ANNOTATION_TYPE, CONSTRUCTOR, PARAMETER, TYPE_USE})
@Retention(RUNTIME)
@Documented
// 指定检验器，可以指定多个检验器，对不同的数据类型检验
@Constraint(validatedBy = {PhoneValidator.class})
public @interface Phone {
    String message() default "{leftover.jsr.validation.constraints.Phone.message}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

```

2. 具体的检验器，需要实现`ConstraintValidator`接口

```java
// 对带有Phone注解的String类型字段检验
public class PhoneValidator implements ConstraintValidator<Phone, String> {

    private static final String REGEX = "^(?:\\+?86)?1[3-9]\\d{9}$";

    //    做一些初始化的工作
    @Override
    public void initialize(Phone constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
    }

    //    检验的逻辑
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }
        return value.matches(REGEX);
    }
}

```

3. 在对应的字段上使用即可

```java
@Phone
@NotBlank(groups = {Crud.Create.class}, message = "手机号不能为空")
private String phone;
```

## 嵌套验证

使用`@Valid`实现嵌套验证

```java
public class Address {

    @NotBlank(message = "城市不能为空")
    private String city;
    @NotBlank(message = "街道不能为空")
    private String street;
}

@TableName(value = "user3")
@Data
public class User3 {
    @TableId(type = IdType.AUTO)
    @Null(groups = {Crud.Create.class}, message = "新增时userId必须为空")
    @NotNull(groups = {Crud.Delete.class, Crud.Update.class, Crud.Query.class}, message = "userId不能为空")
    private Integer userId;
  
    @Phone
    @NotBlank(groups = {Crud.Create.class}, message = "手机号不能为空")
    private String phone;

  
  // 实现嵌套验证，若没有加这个注解，则不会检验Address中的属性是否符合要求
    @Valid
    @TableField(exist = false)
    @NotNull
    private Address address;
}
```

## @Validated和@Valid区别

| 区别         | @Valid                             | @Validated                                     |
| ------------ | ---------------------------------- | ---------------------------------------------- |
| 提供者       | JSR规范里的                        | Spring 做的一个自定义注解                      |
| 是否支持分组 | 不支持                             | 支持，参数校验时，根据不同的分组采取不同的校验 |
| 使用位置     | 构造函数、方法、方法参数、成员属性 | 类、方法、方法参数，不能用于成员属性           |
| 嵌套校验     | 支持，因为可以在成员属性上使用     | 不支持                                         |

## 集合参数校验

当我们传递的参数是一个集合时，若我们想对这个集合`List<Prop>`进行校验

```java

@Data
public class Prop {
    @NotBlank(groups = {Crud.Create.class}, message = "environment不能为空")
    private String environment;
}
```


此时只能使用`@Valid`注解进行校验，使用`@Validated`不能对List里面的元素进行校验；但是`@Valid`注解又不支持分组检验，倘若我们既想嵌套检验又想分组检验，有以下2种方法实现
1. 创建一个类，将list作为一个成员属性放到这个类里

```java
    @PostMapping("/user3")
    public ResponseEntity createUser3( @Valid({Crud.Create.class}) @RequestBody OuterPro  outProps) {
        System.out.println(outProps.getProps());
        return ResponseEntity.ok(LocalDateTime.now());
    }
```
缺点：改变了请求的参数结构

2. 实现一个自己的List类，创建一个data元素（存放真正的数据）

```java
@Data
public class ValidList<E> implements List<E> {
    // 使用该注解就不需要手动重新 List 中的方法了
    @Delegate
    @Valid
    private List<E> data = new ArrayList<>();

}
```

```java
    @Validated
    @PostMapping("/user3")
    public ResponseEntity createUser3(
      //使用自己实现的集合
            @Validated({Crud.Create.class}) @RequestBody ValidList<Prop> props,
    ) {
      //获取真正的数据
        System.out.println(props.getData());
        return ResponseEntity.ok(LocalDateTime.now());
    }
}
```




​    

# JSR310

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

##  @JsonFormat 注解

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

## @DateTimeFormat

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

## `@JsonDeserialize`

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

## `@JsonSerialize`

- **用途**：指定自定义的序列化器，用于将 Java对象 转换为 JSON 字符串。



# JSR 250

## @Resource

## @PostContruct

`@PostConstruct` 方法在对象实例化和依赖注入之后，但在对象的其他方法（如业务方法）被调用之前执行。

可以用于初始化bean之后加载一些数据，用于初始化资源或配置，如** 数据库连接、启动线程、查必需的属性是否已正确配置、从数据库或文件加载初始数据到缓存中。*

## @PreDestory

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

