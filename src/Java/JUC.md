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

### yield

`yield`有退让，谦让的意思，调用yeild方法会让那个当前线程从Running进入Runnable状态，但是，需要注意的是，让出的CPU并不是代表当前线程不再运行了，如果在下一次竞争中，又获得了CPU时间片当前线程依然会继续运行。另外，让出的时间片只会分配**给当前线程相同优先级**的线程

## sleep vs wait

1. sleep是Thread类上面的方法，而wait是Object类上的方法
2. sleep不需要强制和synchronized配合使用，而wait需要和synchronized一起使用（需要先获取到锁）
3. sleep在睡眠的同时只会释放cpu，不会释放对象锁；而wait在等待的时候会释放cpu和对象锁
4. 调用之后线程都会进入`WAITING`或者`TIMED_WAITING`状态

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

<img src="https://img.leftover.cn/img-md/202407191511207.png" alt="93a6321886a615e0b89bfb1ee07cdc96" style="zoom:67%;" />



# synchronized

## synchronized加在方法上

加在成员方法上等价于锁住`this`

加在static方法上等价于锁住`类对象`

如下面代码所示：

```java
    class Test {
        synchronized void method() {

        }

        // 等价于
        void method() {
            synchronized (this) {

            }
        }

      
      
        synchronized static void method2() {

        }

        // 等价于
        static void method2() {
            synchronized (Test.class) {

            }
        }
```

## synchronized底层原理

<img src="https://img.leftover.cn/img-md/202407201340028.png" alt="image-20240720134009153" style="zoom:50%;" />

<img src="https://img.leftover.cn/img-md/202407201340826.png" alt="image-20240720134021371" style="zoom:60%;" />

<img src="https://img.leftover.cn/img-md/202407201415829.png" alt="image-20240720141549975" style="zoom:50%;" />

```java
public class Synchronized {
    public static void main(String[] args) {
        synchronized (Synchronized.class) {
            System.out.println("hello world");

        }
    }
}
```

使用javap -v  Synchronized.class 将上述代码编译成Java字节码文件如下：

```java
  public static void main(java.lang.String[]);
    descriptor: ([Ljava/lang/String;)V
    flags: (0x0009) ACC_PUBLIC, ACC_STATIC
    Code:
      stack=2, locals=3, args_size=1
         0: ldc           #2                  		//获取lock的引用
         2: dup 																	// 复制一份lock
         3: astore_1															// 存入 slot 1
         4: monitorenter									// 获取对象的monitor，将lock对象的markword的前30 bit变为Monitor指针，指向对应的Monitor
         5: getstatic     #3                  // Field java/lang/System.out:Ljava/io/PrintStream;
         8: ldc           #4                  // String hello world
        10: invokevirtual #5                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V
        13: aload_1														// 加载lock的引用
        14: monitorexit												// 将lock对象MarkWord重置，唤醒EntryList
        15: goto          23 									
                  													// 若抛出了异常，则会执行到这里
        18: astore_2												//将异常的变量e 存入 slot2	
        19: aload_1													// 加载lock的引用
        20: monitorexit											// 将lock对象MarkWord重置，唤醒EntryList
        21: aload_2													//加载异常变量e
        22: athrow													// throw e
        23: return	
      Exception table:
         from    to  target type
             5    15    18   any
            18    21    18   any
```

**大致的流程如下：**

   在进入到synchronized同步块中，需要通过monitorenter指令获取到对象的monitor（也通常称之为对象锁）后才能往下进行执行，在处理完对应的方法内部逻辑之后通过monitorexit指令来释放所持有的monitor，以供其他并发实体进行获取（synchronized是非公平锁，即EntryList中的线程会一起竞争这把锁）。代码后续执行到第15行goto语句进而继续到第23行return指令，方法成功执行退出。另外当方法异常的情况下，如果monitor不进行释放，对其他阻塞对待的并发实体来说就一直没有机会获取到了，系统会形成死锁状态很显然这样是不合理。

因此针对异常的情况，会执行到第20行指令通过monitorexit释放monitor锁，进一步通过第22行字节码athrow抛出对应的异常。从字节码指令分析也可以看出在使用synchronized是具备隐式加锁和释放锁的操作便利性的，并且针对异常情况也做了释放锁的处理。

每个对象都存在一个与之关联的monitor，线程对monitor持有的方式以及持有时机决定了synchronized的锁状态以及synchronized的状态升级方式。

## 轻量级锁

轻量级锁的优化在于：

- 在个多线程不在同一时间使用锁，即没有竞争的情况下，使用轻量级锁相比重量级锁来说就是优化

  1. 线程在执行同步块之前，JVM会先在当前线程的栈桢中**创建用于存储锁记录的空间**，然后线程尝试用 cas 替换 Object 的 Mark Word为指向锁记录的指针(锁记录的地址)，将 Mark Word 的值存入锁记录

     

     <img src="https://img.leftover.cn/img-md/202407201547424.png" alt="image-20240720154720182" style="zoom:50%;" />

     如果 CAS 失败，有两种情况

     如果是其它线程已经持有了该 Object 的轻量级锁，这时表明有竞争，进入锁膨胀过程（升级为重量级锁）

     如果是自己执行了 synchronized 锁重入，那么再添加一条 Lock Record 作为重入的计数

     >后面会用偏向锁来优化锁重入的这种情况

     <img src="https://img.leftover.cn/img-md/202407201551020.png" alt="image-20240720155121549" style="zoom:50%;" />

     当退出 synchronized 代码块（解锁时）如果有取值`为 null` 的锁记录，表示有重入，这时重置锁记录，表示重入计数减一

     当退出 synchronized 代码块（解锁时）锁记录的值`不为 null`，这时使用 cas 将 Mark Word 的值恢复给对象头

     - 成功，则解锁成功

     - 失败，说明轻量级锁已经升级为重量级锁，进入重量级锁解锁流程

## 重量级锁

### 重量级锁的流程

线程1 获取了 object的轻量级锁，线程2还想获取锁，这时候该对象已经被线程1加了轻量级锁了，这时候就会进行锁膨胀，将轻量级锁升级为重量级锁，

这时 线程2 加轻量级锁失败，进入锁膨胀流程

- 即为 object 对象申请 Monitor 锁，让 object 的mark word 指向重量级锁地址

- 然后自己进入 Monitor 的 EntryList

线程1 如果执行完了同步代码块，会使用CAS尝试释放轻量级锁，但此时已经升级为了重量级锁，CAS失败，需要走重量级锁的释放流程，即按照 Monitor 地址找到 Monitor 对象，设置 Owner 为 null，唤醒 EntryList 中 BLOCKED 状态的线程



### 重量级锁的自适应自旋优化

即当锁为重量级锁时，若获取锁失败，会多次尝试获取锁（次数不确定）。

- 如果当前线程自旋成功（即这时候持锁线程已经退出了同步块，释放了锁），这时当前线程就可以避免阻塞。
- 若自旋失败，则进入阻塞队列

**注意：**

自旋会占用 CPU 时间，单核 CPU 自旋就是浪费，多核 CPU 自旋才能发挥优势。

- 在 Java 6 之后自旋是自适应的，比如对象刚刚的一次自旋操作成功过，那么认为这次自旋成功的可能性会高，就多自旋几次；反之，就少自旋甚至不自旋，总之，比较智能。

- Java 7 之后不能控制是否开启自旋功能

## 偏向锁

HotSpot的作者经过研究发现，大多数情况下，锁不仅不存在多线程竞争，而且总是由同一线程多次获得，为了让线程获得锁的代价更低而引入了偏向锁。使用轻量级锁时，同一个线程获取锁时（多次重入），每次重入仍然需要执行 CAS 操作。



为了减少同一线程多次重入时的CAS的次数，Java 6 中引入了偏向锁来做进一步优化：当一个线程访问同步块并获取锁时，会在**对象头**和**栈帧中的锁记录**里存储持有偏向锁的线程ID，以后该线程在进入和退出同步块时不需要进行CAS操作来加锁和解锁，只需简单地测试一下对象头的Mark Word里是否存储着指向当前线程的偏向锁。如果测试成功，表示线程已经获得了锁。如果测试失败，则需要再测试一下Mark Word中偏向锁的标识是否设置成1（表示当前是偏向锁）：如果没有设置，则使用CAS竞争锁（使用轻量级锁）；如果设置了，则尝试使用CAS将对象头的偏向锁指向当前线程（设置mark word ，使用偏向锁）

下图是偏向锁的对象头的mark word结构（32位JVM）

![image-20240720161608849](https://img.leftover.cn/img-md/202407201616062.png)



一个对象创建时：

- 如果开启了偏向锁（默认开启），那么对象创建后，markword 值为 0x05 即最后 3 位为 101，这时它的thread、epoch、age 都为 0

- 偏向锁是默认是延迟的，不会在程序启动时立即生效，如果想避免延迟，可以加 VM 参数 -XX:BiasedLockingStartupDelay=0 来禁用延迟

- 如果你确定应用程序里所有的锁通常情况下处于竞争状态，可以通过JVM参数关闭偏向锁：-XX:UseBiasedLocking=false

- **注意：**调用了对象的 hashCode，但偏向锁的对象 MarkWord 中存储的是线程 id，如果调用 hashCode 会导致偏向锁被撤销

  轻量级锁会在锁记录中记录 hashCode

  重量级锁会在 Monitor 中记录 hashCode

### 偏向锁的批量重偏向

​	当某个类的对象撤销偏向锁的次数超过20次（默认20），JVM会觉得是不是偏向错了，因此下次获取锁的时候不会撤销偏向锁，而是直接通过 CAS 操作将其`mark word`的线程 ID 改成当前线程 ID，这也算是一定程度的优化，毕竟没升级锁

### 偏向锁的批量撤销

​    当某个类的对象撤销偏向锁的次数超过40次（默认40），jvm会觉得自己确实偏向错了，根本就不该偏向。因此整个类的所有对象都会变为不可偏向，新建的对象也是，之后对于该 class 的锁，直接走轻量级锁的逻辑

## 整体的流程

T2线程先判断object的锁的状态

- 若为无锁状态，则直接获取到偏向锁

- 若为偏向锁，则看一下对象头的Mark Word里是否存储的线程ID是否是自己的线程ID，

  - 若是，则表示锁重入，获取到锁
  - 若不是则尝试使用CAS竞争锁，获取失败后，此时会将偏向锁升级为轻量级锁

  >这里也不一定会升级，请看上面的偏向锁的批量重偏向和批量撤销

- 若为轻量级锁，则尝试使用CAS获取锁，看一下是否获取成功，如果 CAS 失败，有两种情况

  1. 如果是自己执行了 synchronized 锁重入，那么再添加一条 Lock Record 作为重入的计数

  2. 如果是其它线程已经持有了该 Object 的轻量级锁，这时表明有竞争，进入锁膨胀过程（升级为重量级锁）

  - 即为 object 对象申请 Monitor 锁，让 object 的mark word 指向重量级锁地址

  - 然后T2线程进入 Monitor 的 EntryList，等待被唤醒

- 若为重量级锁，尝试获取monitor，若失败，由于重量级锁有自适应自旋，因此会多次尝试获取锁，若都失败则将该线程放入EntryList，线程进入BLOCK状态

  <img src="https://img.leftover.cn/img-md/202407210045691.jpeg" alt="b37a4182bd530f26498c91130754eee3" style="zoom: 67%;" />

⚠️：轻量级锁没有自旋，重量级锁才有

## 为什么JDK15要废弃偏向锁

1. 偏向锁的引入导致代码很复杂，给HotSpot虚拟机中锁相关部分与其他组件之间的交互也带来了复杂性。这种复杂性使得理解代码的各个部分变得困难，并且阻碍了在同步子系统内进行重大设计更改。因此，废弃偏向锁有助于减少复杂性，使代码更容易维护和改进。
2. 在过去，Java 应用通常使用的都是 HashTable、Vector 等比较老的集合库，这类集合库大量使用了 synchronized 来保证线程安全。然而过去能够从偏向锁中获得的性能提升在当今的应用中不再明显。在单线程场景中，许多现代应用程序可以使用不需要同步的集合类（HashMap，ArrayList）;在多线程场景中，使用更高性能的并发数据结构（如ConcurrentHashMap、CopyOnWriteArrayList等），而不再频繁地执行无争用的同步(synchronized)操作。

reference: [JEP 374: Deprecate and Disable Biased Locking](https://openjdk.org/jeps/374)



# wait 和notify

1. obj.wait() ：让进入object monitor的线程到waitSet中等待，会释放cpu和锁，并且线程到状态变为`WAITING`
2. obj.wait(long)：和obj.wait()一样，不同的是：线程到状态变为`TIMED_WAITING`
3. obj.notify() ：唤醒一个object monitor上正在waitSet等待的线程
4. obj.notifyAll() ：唤醒所有object monitor上正在waitSet等待的线程

>他们都是线程之间协作的手段，都属于Object对象的方法，必须获得此对象的锁，才能调用这几个方法

使用wait 和notify的正确姿势（有待之后实验）

<img src="https://img.leftover.cn/img-md/202407210118120.png" alt="image-20240721011824948" style="zoom:50%;" />

# 变量的线程安全分析

<img src="https://img.leftover.cn/img-md/202407201258809.png" alt="image-20240720125805140" style="zoom:50%;" />

# 常见的线程安全类

String 、Integer、StringBuffer、Random、Vector、HashTable、java.util.concurrent包下的类

