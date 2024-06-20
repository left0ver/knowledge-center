pom（project object model） ： 项目对象模型

mvn首先会在本地仓库中找对应的jar包，本地仓库没找到则去中央仓库下载

mvn 中一条命令可能包含了多个生命周期 ，每个生命周期是由对应的插件执行的

## mvn 命令

1. mvn compile   编译Java项目为对应的字节码文件
2. mvn clean    清除编译的jar包，字节码文件等等，会删除target文件夹

3. mvn test-compile 编译测试代码为字节码文件
4. mvn test 运行测试代码（会自动编译）

5. mvn install 将当前项目生成的jar包或者war包安装到本地仓库，会按坐标保存到指定位置，可以供本地其他项目引用



## 依赖范围

<img src="https://img.leftover.cn/img-md/202405052246311.png" alt="image-20240505224651289" style="zoom:50%;" />

provided : 已提供依赖范围，即该`依赖在运行时由服务器提供`，其对应的版本由服务器决定，所以该依赖只在编译和测试环境有效。例如`servlet-api` 在运行时由tomcat服务器提供

import : 将目标依赖的pom.xml文件中的dependencyManagement标签中的内容 和当前pom.xml 的 dependencyManagement 标签中的内容进行合并

## 依赖传递

项目中依赖了 A ，A依赖B ，如果B的依赖范围为`compile`（只有compile类型的依赖可以传递）,B依赖可以传递到该项目中，即该项目可以在不导入B到情况下使用B

```xml
<dependency>
  <!-- optional 标签设置为true，可以终止依赖的传递-->
   <optional>true</optional>
</dependency>
```

**依赖传递终止**

- 非compile范围依赖 不会进行依赖传递
- 使用了optional配置终止传递依赖
- 依赖冲突（传递的依赖在项目中已经存在）

## maven解决依赖冲突

### maven自动解决依赖冲突的问题

1. 短路优先原则
2. 路径长度相同时，则先声明优先（即在上面的优先）

![image-20240506153606700](https://img.leftover.cn/img-md/202405061536891.png)

### 手动解决依赖冲突问题

```xml
 <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter-api</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
            <optional>true</optional>
   
<!--            终止这个包下面的某个依赖的传递 -->
            <exclusions>
                <exclusion>
                    <groupId>org.apiguardian</groupId>
                    <artifactId>apiguardian-api</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
```

## Maven工程的继承关系

1. 使用父工程进行依赖管理（父工程中不写代码）

   如果在父工程中直接使用`dependencies` 标签进行依赖管理，其所有的依赖都会继承给子工程

   因此我们在父工程中一般使用`dependencyManagement`标签来进行依赖的管理，这时候父工程的依赖不会直接继承给子工程，而需要子工程自己配置需要使用哪些依赖

  例如

```xml
 父工程的pom.xml 
<dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.alibaba</groupId>
                <artifactId>druid</artifactId>
                <version>1.2.7</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

子工程的pom.xml
 <dependencies>
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
<!--            这里不需要设置版本号 ，使用的是父工程中这个插件对应的版本 ,若设置了版本号且版本号与父工程的不一致，则不会使用父工程的依赖-->
        </dependency>
    </dependencies>
```

### Maven工程聚合关系

1. Maven聚合是指将多个项目组织到一个父级项目中，以便一起构建和管理的机制。聚合可以帮助我们更好地管理一组相关的子项目，同时简化他们的构建和部署过程

2. **聚合作用** :

   - 父工程中执行了一组命令，在每个子工程中也会执行相应的命令，简化了构建和部署
   - 优化构建顺序：通过聚合，可以对多个项目进行顺序控制，避免出现构建依赖混乱导致构建失败的情况
   - 统一管理依赖项：通过聚合可以在父工程中管理公共依赖项和插件，避免重复定义

3. 聚合语法

   ```xml
    <modules>
    		<!--⚠️ 这里写的是模块的路径名，而不是模块名，因此下面的写法等价于  <module>./maven_son</module>-->
           <module>maven_son</module>
       </modules>
   ```

   