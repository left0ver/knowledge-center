Java EE三大组件：Servlet程序、 Filter 过滤器、Listener监听器

## Servlet

### Servlet的配置相关

1. Servlet是运行在服务区上的一个Java程序，可以接收客户端发送过来的请求，并响应数据给客户端
2. Servlet的配置web.xml的配置

```xml
<!--    配置servlet对应的请求路径-->
    <servlet>
<!--        名称 ， 配置路径映射的时候会用到-->
        <servlet-name>userServlet</servlet-name>
<!--        需要加载的servlet类-->
        <servlet-class>com.leftover.servlet.UserServlet</servlet-class>
    </servlet>
<!--    配置对应的路径映射-->
    <servlet-mapping>
<!--        servlet名称-->
        <servlet-name>userServlet</servlet-name>
<!--        对应的请求路径-->
        <url-pattern>/user</url-pattern>
      <!--        一个servlet可以对应多个请求路径-->
        <url-pattern>/user1</url-pattern>
```

3. url-pattern的匹配模式由`精确匹配`和`模糊匹配` ，使用* 进行模糊匹配

   ```xml
   <servlet-name>userServlet</servlet-name>  
   <url-pattern>/user</url-pattern>
   <!-- 匹配全部，但是不包括jsp文件-->
   <url-pattern>/</url-pattern>
   <!-- 匹配全部，包括jsp文件 -->
   <url-pattern>/*</url-pattern>
   <!-- 匹配前缀，后缀模糊-->
   <url-pattern>/a/*</url-pattern>
   <!-- -->
   <url-pattern>*.a</url-pattern>
   ```

   

4. 使用注解的方式配置

   在Servlet类上方加上`@WebServlet("/user")` 即可，括号里面配置的是对应的路径名

   ```java
   // name ：给这个Servlet取的别名
   // value ：是urlPatterns 的别名
   // urlPatterns ：配置映射路径
   //配置注解时，若没有指定属性名，则默认为value
   //这里配置了注解，web.xml文件中就不需要再进行配置了，否则启动tomcat时会报错
   @WebServlet({"/user"})
   public class UserServlet extends HttpServlet {
     
   }
   ```

   

### Servlet的生命周期

1. 生命周期

   - 实例化Servlet ，执行构造函数 （只会执行一次）
   - 初始化Servlet ， 执行init（）方法，（实例化Servlet之后）（只会执行一次）
   - 处理服务，执行service（）方法 （每次请求的时候）
   - 销毁，执行destory（）方法，（tomcat关闭时执行，执行一次）

2. 实例化和初始化Servlet默认是在第一次请求的时候会执行，也可以配置loadOnStartUp ，让其在tomcat启动的时候就初始化

   ```java
   // loadOnStartup默认的值为-1，若为一个正整数，则会在tomcat启动时初始化Servlet，数字越低代表优先级越高，tomcat中有些默认的Servlet填了一些优先级，因此建议从10开始往后填写
   @WebServlet(value = {"/user"},loadOnStartup = 1) 
   ```

3. 默认的Servlet：当客户端请求默写静态资源时，此时没有和我们所写的servlet匹配上，这时候就会执行defaultServlet，找到服务器中的对应的静态资源，返回给客户端。（因此，如果当我们覆盖了DefaultServlet，可能会出现资源找不到的情况404）

   

4. ⚠️Servlet在Tomcat中是单例的，就算很多用户请求同一个接口，`也只会创建一个Servlet`

   由于Servlet是单例的，因此Servlet的成员变量在多个线程栈之间是共享的

   所以若在service方法中修改成员变量，在并发请求的时候，会引发线程安全问题，因此`不建议在service方法中修改成员变量的值`

 

### ServletConfig 对象

0.  ServletConfig是每个Servlet所独享的，里面的配置信息只属于某一个Servlet

1. 我们可以通过注解或者web.xml的方式配置init-params,然后可以在代码中通过ServletConfig拿到配置的初始参数

   ```xml
       <servlet>
           <servlet-name>servlet11</servlet-name>
           <servlet-class>com.leftover.servlet.UserServlet</servlet-class>
           <init-param>
               <param-name>age</param-name>
               <param-value>18</param-value>
           </init-param>
       </servlet>
       <servlet-mapping>
           <servlet-name>servlet11</servlet-name>
           <url-pattern>/servlet11</url-pattern>
       </servlet-mapping>
   ```

   ```java
   //注解的方式配置init - param
   @WebServlet(urlPatterns = "servlet11", initParams = {@WebInitParam(name = "age", value = "18"), @WebInitParam(name = "username", value = "zwc")})
   ```

		代码中获取initParameters
   ```java
           String username = getInitParameter("username");
           System.out.println(username);
   //       Enumeration 是早期的一个迭代器
           Enumeration<String> initParameterNames = getInitParameterNames();
   //        获得所有的initParameter
           while (initParameterNames.hasMoreElements()) {
   //            key
               String key = initParameterNames.nextElement();
               System.out.print(key + " ");
   //            value
               String value = getInitParameter(key);
               System.out.print(value + " ");
   
           }
   ```

### ServletContext 对象

1. 可以为所有的Servlet配置初始参数(只能在web.xml里面配置)

   具体的用法和ServletConfig差不多，但只能在`web.xml`里面配置

   ```xml
   <web-app> 
     
   <context-param>
           <param-name>phone</param-name>
           <param-value>xiaomi</param-value>
   </context-param>
     
   </web-app> 
   
   

2. 获取资源的真实路径和项目的上下文路径
  ```java
        ServletContext servletContext = getServletContext();
          /**
           *   获取项目部署的上下文路径,
           *   例如http://localhost:8080/study_servlet/servlet1
           *    上下文路径为/study_servlet
           */
          String contextPath = servletContext.getContextPath();   
  
  				/**
  	     * 获取一个指向项目部署位置下面一级(只能一级)某个文件/目录的磁盘真实路径的api （返回的是一个绝对地址）
  	     */
  	    String path = servletContext.getRealPath("leftover");
  ```

3. ServletContext 代表应用，所以ServletContext的域也叫应用域，是webapp中最大的域，`使用ServletContext可以与其他的Servlet进行通信` ，类似vuex之类的 ，⚠️but会有线程安全的问题

   ```java
      		 servletContext.setAttribute("timeZoned", "UTC");
    
   			// 其他Servlet
    		    String timeZoned =(String) servletContext.getAttribute("timeZoned");
           System.out.println(timeZoned);
           servletContext.removeAttribute("timeZoned");
   ```

### HttpServletRequest 对象

```java
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
				System.out.println(req.getMethod());
        System.out.println(req.getScheme()); // 获取请求的协议  http
        System.out.println(req.getProtocol()); // 获取请求的协议和版本号 HTTP/1.1

        System.out.println(req.getLocalPort()); // 本地容器的端口号 8080
        System.out.println(req.getRemotePort()); // 客户端软件的端口号  65486
        System.out.println(req.getServerPort());  // 客户端发请求时使用的端口号 8080

        System.out.println(req.getLocale());  //国家信息  zh_CN

        System.out.println(req.getRequestURI()); //统一资源标识符 /study_servlet/httpServlet

        System.out.println(req.getRequestURL()); //http://localhost:8080/study_servlet/httpServlet
        
//        下面三个api可以用来获取queryString或者请求体中的参数
        System.out.println(req.getParameter("username"));
        System.out.println(req.getParameterNames());
        System.out.println(req.getParameterMap());
    }
```

### HttpServletResponse 对象

```java
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
//        设置状态码
        resp.setStatus(200);
//        设置响应头
        resp.setHeader("aaa", "1323");
//        设置响应体的长度
        resp.setContentLength(1323);
        resp.setContentType("text/html");
    }
```

### 请求转发

1. 特点
   - 对客户端是透明的，客户端端地址栏不变
   - 转发的目标资源可以说servlet 动态资源， 也可以是html，css等静态资源
   - 目标资源可以说WEB—INF下的受保护的资源（正常情况说是访问不了WEB—INF下的资源的），该方式也是WEB—INF下的资源的唯一访问方式
   - 目标资源不可以是外部资源。 例如 https://leftover.cn ,只能是内部的资源
   - 只能转发一次，转发多次会出现错误，会返回500状态码

```java
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        System.out.println("A");

//        转发到另外一个servlet
        RequestDispatcher dispatcher = req.getRequestDispatcher("servletB");
        dispatcher.forward(req, resp);

//        转发到html静态资源上
//        RequestDispatcher dispatcher1 = req.getRequestDispatcher("index.html");
//        dispatcher1.forward(req, resp);

    }
```



### 临时重定向

1. 特点

   - 临时重定向是服务端返回给客户端一个302状态码，然后设置响应头中的`Location`字段，告诉客户端重定向的资源路径

   - 客户端的地址栏会发生变化
   - 客户端至少会产生2次请求
   - 目标资源可以是静态资源，也可以是servlet，可以是外部资源（例如https://leftover.cn）⚠️but 不可以为WEB-INF下的资源（因此WEB-INF下的资源是受保护的，只能通过请求转发访问）

```java
//        临时重定向302
        resp.sendRedirect("servletD");
//        也可以
//        resp.setStatus(302);
//        resp.setHeader("Location","servletD");
```

### 响应体的乱码问题

```java
//        设置响应体的编码方式
        resp.setCharacterEncoding("utf-8");
//        设置ContentType 响应头，告诉客户端使用utf-8进行解码
        resp.setContentType("text/html;charset=utf-8");
```

### 请求转发到路径问题

```java
	@WebServlet("/x/y/servlet8")

// ⚠️上下文路径为 /study_servlet
//        这里写的是相对路径  ，会被转发到 http://localhost:8080/study_servlet/x/y/servleE
//        req.getRequestDispatcher("servletE").forward(req, resp);

//        请求转发时，绝对路径不需要添加上下文路径 ，此时会被转发到 http://localhost:8080/study_servlet/servleE
        req.getRequestDispatcher("/servletE").forward(req, resp);
```

### 重定向的路径问题

```java
      
			@WebServlet("/x/y/servlet9")
			/**    相对路径的写法 ，会被重定向到 http://localhost:8080/study_servlet/x/y/servletE
         *
         *		  resp.sendRedirect("servletE");
         */ 
    


        /** 绝对路径的写法
         * req.getContextPath() 获取的是上下文路径 /study_servlet
         *  重定向的绝对路径的写法上要写上下文路径
         *  下面的写法等价于    resp.sendRedirect("/study_servlet/servletE");
         */
        resp.sendRedirect(req.getContextPath() + "/servletE");
```

### 配置tomcat的上下文路径为 “/”

<img src="https://img.leftover.cn/img-md/202405091526027.png" alt="image-20240509152628988" style="zoom: 25%;" />

## 会话管理

### Cookie

1. 对于同一个网址，不同的tab之间的cookie是可以共享的

### Session

有些用户的敏感数据存在cookie中不合适，一般这种数据会存在session里面。cookie中一般存一些不敏感的数据

Session的本质就是使用一个JSESSIONID（JSESSIONID存在cookie中），因此Session要依赖于cookie，我们将数据存在session中，通过JSESSIONID找到对应的session。

```java
/**
 *      1.  根据请求头中的cookie中的JSESSIONID字段找到对应的session ， 返回旧的session
 *      2.  若cookie中没有JSESSIONID字段，或者 有JSESSIONID字段，但没找到对应的session，
 *            则会创建一个新的session ，再将JSESSIONID 存入cookie中，返回给客户端，最后返回新的session
 */
        HttpSession session = req.getSession();
        System.out.println(session.getId());
//        session是否是新创建的
        System.out.println(session.isNew());
//       设置 session的过期时间为60s ，tomcat的默认的session的过期时间是30min ，可以通过
        session.setMaxInactiveInterval(60);
//        向session中存储字段
        session.setAttribute("username", "zwc66");
        resp.getWriter().println("hello");
```

### 三大域对象

1. 请求域对象：HttpServletRequest 对象，传递数据的范围是`一次请求之内`以及`请求转发` 。一般存放本次请求业务相关的数据，如：查询到的所有的部门信息
2. 会话域对象：HttpSession ，传递数据的范围是`一次会话之内`，可以跨多个请求 。 一般存放本次会话的客户端有关的数据，如当前登陆的用户，用户权限等等
3. 应用域对象是ServletContext， 传递数据的范围是`本应用之内`，可以跨多个会话 。一般存放本程序应用有关的数据，如：Spring框架的IOC容器

## 过滤器

### 基本地使用过滤器

```xml
<!-- web.xml-->
<!-- 配置过滤器-->
    <filter>
        <filter-name>LoggerFilter</filter-name>
        <filter-class>com.leftover.filter.LoggerFilter</filter-class>

    </filter>
    <filter-mapping>
        <filter-name>LoggerFilter</filter-name>
        <!--        -->
        <!--        /* 匹配所有资源-->
        <!--        /a/* 匹配/a开头的所有资源-->
        <!--        *.html 匹配html资源-->
        <url-pattern>/servlet1</url-pattern>
        <servlet-name>servletA</servlet-name>
    </filter-mapping>
```

### 过滤器的生命周期

1. 构造 – 执行构造函数中的方法 - 项目启动的时候就会执行 - 只会执行一次
2. 初始化- 执行init方法  - 构造完毕之后立刻执行  - 只会执行一次
3. 过滤 - 执行doFilter方法 - 每次请求的时候执行 -可能执行多次
4. 销毁 - 执行destory 方法 ，服务关闭的时候执行 - 只会执行一次



### 过滤器链

1. 过滤器链中的过滤器顺序由filter-mapping顺序决定
2. 如果某个Filter是使用ServletName进行匹配规则的配置，那么这个Filter执行的优先级要低

```xml
 <filter>
        <filter-name>LoggerFilter</filter-name>
        <filter-class>com.leftover.filter.LoggerFilter</filter-class>
    </filter>
    <filter>
        <filter-name>LoggerFilter1</filter-name>
        <filter-class>com.leftover.filter.LoggerFilter1</filter-class>
    </filter>
    <filter>
        <filter-name>LoggerFilter2</filter-name>
        <filter-class>com.leftover.filter.LoggerFilter2</filter-class>
    </filter>

    <filter-mapping>
        <filter-name>LoggerFilter</filter-name>
        <!--        -->
        <!--        /* 匹配所有资源-->
        <!--        /a/* 匹配/a开头的所有资源-->
        <!--        *.html 匹配html资源-->
        <url-pattern>/*</url-pattern>
        <servlet-name>servletA</servlet-name>
    </filter-mapping>
    <filter-mapping>
        <filter-name>LoggerFilter1</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>
    <filter-mapping>
        <filter-name>LoggerFilter2</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>
```

```java
对应的执行顺序
start filter
loggerFilter1 start
loggerFilter2 start
into servlet1
loggerFilter2 end
loggerFilter1 end
end filter
```

### 监听器

1. 监听器：专门用于对域对象身上发生的事件或者状态改变进行监听和相应处理的对象
2. 按监听的对象划分
   - ServletContext对象的监听器 ServletContextListener（ServletContext对象的创建和销毁）   ServletContextAttributeListener（ServletContext对象中的字段的增删改）
   - Session域的监听器  HttpSessionContextListener（Session的创建和销毁）   HttpSessionContextAttributeListener （Session字段的增删改）HttpSessionBindingListener（监听当前监听器对象在session域中的增加和删除）  HttpSessionActivationListener（监听某个对象在Session中的序列化与反序列化）
   - request域 ServletRequestListener（请求域的创建和销毁）   ServletRequestAttributeListener （请求域中的字段的增删改）

​	

基本使用，只要做了相应的操作就会触发相应的监听器

```java
package com.leftover.listener;

import jakarta.servlet.annotation.WebListener;
import jakarta.servlet.http.*;

@WebListener
public class MySessionListener implements HttpSessionListener, HttpSessionAttributeListener {
    @Override
    public void sessionCreated(HttpSessionEvent se) {
        System.out.println("session 对象被创建了，为" + se.getSession().hashCode());

    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        System.out.println("session 对象被销毁了，为" + se.getSession().hashCode());
    }

    @Override
    public void attributeAdded(HttpSessionBindingEvent se) {
        System.out.println("添加的属性名为" + se.getName() + "属性值为" + se.getValue());
    }

    @Override
    public void attributeRemoved(HttpSessionBindingEvent se) {
        System.out.println("删除的属性名为" + se.getName() + "属性值为" + se.getValue());
    }

    @Override
    public void attributeReplaced(HttpSessionBindingEvent se) {
        HttpSession session = se.getSession();
        Object newValue = session.getAttribute(se.getName());
        System.out.println("更新属性名为" + se.getName() + "旧的属性值为" + se.getValue() + "新的属性值为" + newValue);
    }
}

```

