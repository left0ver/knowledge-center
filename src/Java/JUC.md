# 工具

`jps` 查看所有的Java进程

`jstack [pid]` 查看某个Java进程当前时刻的线程信息

`jconsole` 可以查看Java运行时的内存，线程等情况

# 并发和并行

并发是指多个任务交替执行。

并行是指多个任务`同时`进行

若系统中只有一个cpu，那么在使用多线程时，那么真实系统环境下不能并行，只能通过切换时间片的方式交替进行，而成为并发执行任务 。只有多核cpu才能并行执行任务

# 线程上下文切换

导致现场上下文切换的原因：

- 线程cpu时间片用完
- 垃圾回收
- 有更高优先级的线程需要运行
- 线程自己调用了sleep、yield、wait、join、park、synchronized、lock等方法

上下文切换会导致用户态与内核态的切换，因此线程不是越多越好，频繁的上下文切换会影响性能

# 线程常见的方法

## start vs run

1. start方法，会判断一个线程是否是`NEW`状态，

      若不是则说明线程已经start过，抛出异常（start方法只能调用一次）

      若是，则创建线程，在新的线程中调用run方法

   调用start方法之后，线程会进入`RUNNABLE`状态

2. run方法不会启动一个新线程，哪个线程调用了此方法就在哪个线程中执行。

   >若在构造Thread对象时传递了Runnable参数，则调用此方法会执行Runnable中的run方法，否则不会执行任何操作直接return；
   >
   >可以创建Thread的子类来重写此方法



## sleep vs yield

### sleep

1. 调用sleep方法之后，当前线程会从`Running` 进入`TIMED_WAITING` 状态
2. 其他线程可以使用`interrupt`方法打断正在睡眠的线程，这时候sleep方法会抛出`InterruptedException` 异常，执行catch中的代码
3. 建议使用`TimeUnit`的sleep代替Thread的sleep来获得更好的可读性

```java
  TimeUnit.SECONDS.sleep(2);
```

4. 睡眠结束后的线程未必会立刻得到执行

```java
@Slf4j
public class Sleep_yield {
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
//                    Thread.sleep(2000);
                    TimeUnit.SECONDS.sleep(2);
                } catch (InterruptedException e) {
                    log.info("wake up");
                }
                System.out.println(11);
            }
        }, "t1");
        thread.start();
        Thread.sleep(500);
      // TIMED_WAITING
        System.out.println(thread.getState());
        log.info("interrupt");
        // 打断t1线程
        thread.interrupt();
    }
}
```

## sleep vs wait

TODO：

## yield

`yield`有退让，谦让的意思，调用yeild方法会让那个当前线程从Running进入Runnable状态，但是，需要注意的是，让出的CPU并不是代表当前线程不再运行了，如果在下一次竞争中，又获得了CPU时间片当前线程依然会继续运行。另外，让出的时间片只会分配**给当前线程相同优先级**的线程

## join

调用join方法，若传了时间N，则主线程最多会等待N ms（子线程提前结束，则不会继续等待）

若没有传时间，则会一直等到子线程执行完毕之后再往下执行

join底层是使用的wait方法实现的

```java
public class Join {
    static int num = 0;

    public static void main(String[] args) throws InterruptedException {

        Thread thread = new Thread(new Runnable() {
            @SneakyThrows
            @Override
            public void run() {
                TimeUnit.SECONDS.sleep(1);
                num = 10;
            }
        }, "t1");
        thread.start();
      // 等待子线程执行完毕
        thread.join();
        System.out.println(num); // 10
    }
}

```

## interrupt

1. 用来打断线程

- 如果被打断的线程正在`sleep` ,`wait`,`join`,则会导致被打断的线程抛出`InterruptedException`,**并清除打断标记，interrupted = false**

- 如果被打断的是`正在运行的线程`,**则会设置打断标记,interrupted = true** 
- 被打断的是`正在park的线程`，**也会设置打断标记,interrupted = true**, 之后这个线程再执行park方法则不会阻塞，需要**清除打断标记后再执行park方法才会阻塞**

2. isInterrupted（）方法可以判断是否被打断，`return interrupted `
3. interrupted() 方法返回当前线程的打断标记，**并清除打断标记，interrupted =false**

4. 两阶段终止（interrupt）

   在线程T1中如何优雅地终止线程T2？ 这里【优雅】指的是给T2一个处理后事的机会（退出前执行一些逻辑）

   <img src="https://img.leftover.cn/img-md/202407181715359.png" alt="image-20240718171511231" style="zoom:50%;" />

   

```java
@Slf4j
public class Monitor {
    private static Thread monitor;

    public void stop() {
        monitor.interrupt();
        monitor.stop();
    }

    public void beforeExit() {
        log.info("处理后事");
    }

    public void start() throws InterruptedException {
        monitor = new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    // 只有在监控时被打断了才会退出，睡眠时被打断了不会退出
                    if (monitor.isInterrupted()) {
                        beforeExit();
                        break;
                    } else {
                        try {
                            log.info("监控系统。。。");
                            TimeUnit.SECONDS.sleep(2);
                        } catch (InterruptedException e) {
                     
                            // 在睡眠期间被打断
                            e.printStackTrace();
//                             清除打断标记
                            Thread.interrupted();
                          
                          /**
                          如果只是想要在退出前运行一些代码的话，也可以这样
                          即无论是否在睡眠时还是在监控时被打断，都会退出
                          	e.printStackTrace();
                          	beforeExit();
                       			break;
                          */
                        }
                    }
                }
            }
        });

        monitor.start();
        TimeUnit.SECONDS.sleep(1);
        monitor.interrupt();
    }

    public static void main(String[] args) throws InterruptedException {
        new Monitor().start();
    }
}

```

## 过时的方法

这些方法容易破环同步代码块，造成线程死锁

- stop :停止线程运行 （使用两阶段终止（interrupt）替代）
- suspend： 将线程挂起（使用wait替代）
- resume： 恢复线程继续运行（使用notify替代）



# 守护线程

默认情况下，Java进程需要等待所有线程都运行结束，才会结束。有一种特殊的线程叫守护线程，只要其他非守护线程运行结束了，即使守护线程的代码没有执行完，也会强制结束。

# 线程的状态

JUC中使用了一个枚举类定一个线程的状态

- NEW: 线程刚创建。还没调用start方法
- RUNNABLE：运行状态。Java线程将操作系统中的就绪（Ready）和运行（Running）两种状态笼统地称为Runnable状态
- WAITING：等待状态。进入该状态表示当前线程需要等待其他线程做出一些特定特作（notify 或者 interrupt）
- TIMED_WAITING： 超时等待状态，该状态不同于WAITING，它是可以在指定的时间自行返回的
- BLOCK：阻塞状态。当线程出现资源竞争时，即等待获取锁的时候，线程会进入到**BLOCKED**阻塞状态，当线程获取到了锁，会进入Runnable状态（Ready状态）
- TERMINATED：终止状态。表示当前线程已经执行完毕了

**注意：**当线程进入到synchronized方法或者synchronized代码块时，线程切换到的是BLOCKED状态，而使用java.util.concurrent.locks下lock进行加锁的时候线程切换的是WAITING或者TIMED_WAITING状态，因为lock会调用LockSupport的方法。

<img src="https://img.leftover.cn/img-md/202407190212645.png" alt="5ebd66a78e5d3aa6bd465aaa165de62d" style="zoom: 67%;" />