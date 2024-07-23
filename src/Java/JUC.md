# 工具

`jps` 查看所有的Java进程

`jstack [pid]` 查看某个Java进程当前时刻的线程信息

`jconsole` 可以查看Java运行时的内存，线程等情况

[jcstress](https://github.com/openjdk/jcstress)压力测试工具

`javap -v xxx.class` 命令：将某个class编译成字节码文件

[jclasslib Bytecode Viewer](https://plugins.jetbrains.com/plugin/9248-jclasslib-bytecode-viewer)插件可以用来查看类的字节码

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

`yield`有退让，谦让的意思，调用yeild方法会让那个当前线程从Running进入Ready状态，但是，需要注意的是，让出的CPU并不是代表当前线程不再运行了，如果在下一次竞争中，又获得了CPU时间片当前线程依然会继续运行。另外，让出的时间片只会分配**给当前线程相同优先级**的线程

## sleep vs wait

1. sleep是Thread类上面的方法，而wait是Object类上的方法
2. sleep不需要强制和synchronized配合使用，而wait需要和synchronized一起使用（需要先获取到锁）
3. sleep在睡眠的同时只会释放cpu，不会释放对象锁；而wait在等待的时候会释放cpu和对象锁
4. 调用之后线程都会进入`WAITING`或者`TIMED_WAITING`状态

## park vs wait

1. wait，notify，notifyAll必须配合 synchronized 一起使用，而park ，unpark不必
2. park、unpark是以线程为单位来阻塞和唤醒线程，而notify只能随机唤醒一个等待线程，notifyAll是幻想所有的等待线程
3. park & unpark 可以先unpark，而wait & notify 不能先notify（先调用notify 再执行wait还是会阻塞）

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

# ReentrantLock

1. 相对于synchronized ,ReentrantLock 具备以下特点：

   - 和synchronized一样，都支持**可重入**

   - **可中断**，可以调用这个方法`lock.lockInterruptibly()`获取**可以被打断的锁**，之后其他线程可以调用`t1.interrupt()` 打断这个线程

   - **可以设置超时时间**

     - 可以使用`lock.tryLock()`方法获取锁，可以设置超时时间，在超时时间内获取到锁了返回true，否则返回false（可以做一些其他的逻辑）

   - **有公平锁和非公平锁两种锁（默认非公平锁）**，synchronized 只有非公平锁

   - **支持多个条件变量**

     - synchronized只有一个条件变量，调用了wait方法的线程都会进入`waitSet`中

     - ReentrantLock可以设置多个条件变量，可以调用xxxcondition.await() 方法 让线程进入不同的等待队列，再调用xxxcondition.signal() / signalAll() 唤醒某个等待队列中的 一个/全部 线程

       >和 synchronized 一样，调用awiat方法时，必须获取到了锁，否则会抛出异常

# 重排序

## 重排序概述

1. 编译器优化的重排序。编译器在不改变单线程程序语义的前提下，可以重新调整语句的执行顺序。
2. 指令级并行的重排序。现代cpu采用了指令级并行技术来将多条指令重叠执行。如果**不存在数据依赖性**，cpu可以改变语句对应机器指令的执行顺序；
3. 内存系统的重排序。由于cpu使用缓存和读/写缓冲区，这使得加载和存储操作看上去可能是在乱序执行的。

1属于编译器重排序，而2和3统称为cpu重排序。这些重排序会导致线程安全的问题，一个很经典的例子就是DCL问题。**针对编译器重排序**，JMM的编译器重排序规则会禁止一些**特定类型的编译器重排序**；**针对处理器重排序**，编译器在生成指令序列的时候会通过**插入内存屏障指令来禁止某些特殊的处理器重排序**（volatile的底层原理就是插入内存屏障来防止重排序）

## as-if-serial 原则

不管怎么重排序（编译器和处理器为了提供并行度），（单线程）程序的执行结果不能被改变。

## DCL（double-checked-locking）问题

单例模式算是比较常见的设计模式之一了，而`双重检查单例` 是一种比较常见的单例模式的实现之一

```java
    class Singleton {

        private volatile Singleton instance = null;

        public Singleton getInstance() {
                synchronized (Singleton.class) {
                    if (instance == null) {
                        instance = new Singleton();
                    }
                }
            return instance;
        }
    }
```

看上面这段代码，这段代码中使用synchronized来保证线程安全，但这样也有一个缺点，就是当instance已经不为null之后，每次调用getInstance方法都会需要获取锁，大家都知道，这是一种比较耗时的操作，因此我们可以在synchronized前面加一层判断，这就是所谓double-checked

```java
    class Singleton {

        private volatile Singleton instance = null;

        public Singleton getInstance() {
            if (instance == null) {
                synchronized (Singleton.class) {
                    if (instance == null) {
                        instance = new Singleton();
                    }
                }
            }
            return instance;
        }
    }
```

这是getInstance方法的字节码

```java
 0 aload_0
 1 getfield #3 <leftover/DCL$Singleton.instance : Lleftover/DCL$Singleton;>
 4 ifnonnull 44 (+40)
 7 ldc #4 <leftover/DCL$Singleton>
 9 dup
10 astore_1
11 monitorenter
12 aload_0
13 getfield #3 <leftover/DCL$Singleton.instance : Lleftover/DCL$Singleton;>
16 ifnonnull 34 (+18)
19 aload_0
20 new #4 <leftover/DCL$Singleton>
23 dup
24 aload_0
25 getfield #1 <leftover/DCL$Singleton.this$0 : Lleftover/DCL;>
28 invokespecial #5 <leftover/DCL$Singleton.<init> : (Lleftover/DCL;)V>
31 putfield #3 <leftover/DCL$Singleton.instance : Lleftover/DCL$Singleton;>
34 aload_1
35 monitorexit
36 goto 44 (+8)
39 astore_2
40 aload_1
41 monitorexit
42 aload_2
43 athrow
44 aload_0
45 getfield #3 <leftover/DCL$Singleton.instance : Lleftover/DCL$Singleton;>
48 areturn
```

对应` instance = new Singleton();`的字节码大致如下：

```java
20 new #4 <leftover/DCL$Singleton>  // new 一个对象
23 dup															// 将引用复制一份
28 invokespecial #5 <leftover/DCL$Singleton.<init> : (Lleftover/DCL;)V> // 执行构造函数
31 putfield #3 <leftover/DCL$Singleton.instance : Lleftover/DCL$Singleton;> //将对象引用复制给instance变量
```

可以看出这个语句对应好多条指令，因此这里有指令重排序的风险，第28行和第31行是可能指令重排序的（单线程下这两条指令调换顺序不会有影响），因此可能先执行31行再执行28行

我们假设发生了重排序,执行顺序变为了这样，当t1线程执行了31行时，此时将对象复制给了instance，因此这时候instance不为null，但是此时还没执行构造函数

假设此时切换到t2线程，首先判断instance是否为null，此时已经不为 null 了，这时候会直接return，所以这时候return的就是一个还没初始化完毕的对象

```java
20 new #4 <leftover/DCL$Singleton>
23 dup 
31 putfield #3 <leftover/DCL$Singleton.instance : Lleftover/DCL$Singleton;>
28 invokespecial #5 <leftover/DCL$Singleton.<init> : (Lleftover/DCL;)V>
```

这就是指令重排序导致的DCL问题



**解决办法：**给instance变量加上 `volatile `关键字即可防止重排序

# volatile

1. volatile 翻译为易变的，可以修饰 静态成员变量/成员变量 ，顾名思义，该关键字的作用为标记这个变量为易变的，这样就可以避免线程从自己的工作缓存中查找变量的值，必须每次去主存中获取它的值。这样每个线程都从主存中取这个变量的值，因此当一个线程修改了这个变量的值，其他线程就能立刻“看得见” ，所谓可见性。

   <img src="https://img.leftover.cn/img-md/202407221917712.png" alt="image-20240722191759599" style="zoom: 50%;" />

>synchronized 语句块即可以保证代码块的原子性，也同时保证代码块内变量的可见性，但缺点是synchronized是属于重量级操作，性能相对更低



2. volatile的底层实现原理是内存屏障（Memory Barrier）
   - 对volatile变量的 `写指令后` 会加入写屏障
   - 对volatile变量的 `读指令前` 会加入读屏障



3. 可见性问题以及如何保证可见性？

   每个线程都有属于自己的工作内存，并且会把位于主存中的共享变量拷贝到自己的工作内存，之后的读写操作均使用位于工作内存的变量副本，并在某个时刻将工作内存的变量副本写回到主存中去。

   > 因此这就是缓存优化导致的可见性问题，一个线程对共享变量的修改，另外一个线程不能够立刻看到

   <img src="https://img.leftover.cn/img-md/202407230949807.png" alt="image-20240723094925699" style="zoom: 40%;" />

4. 有序性问题以及如何保证有序性？

   为了提高性能，编译器和处理器常常会对指令进行重排序。在单线程环境下重排序不会有什么问题，但在多线程环境下，这种操作会影响多线程的执行顺序，从而导致错误

   <img src="https://img.leftover.cn/img-md/202407230950060.png" alt="image-20240723095015998" style="zoom: 40%;" />

# happens-before规则

happens-before 规定了对共享变量的写操作对其它线程的读操作可见，抛开以下 happens-before 规则，JMM 并不能保证一个线程对共享变量的写，对于其它线程对该共享变量的读可见

1. **程序次序规则（Program Order Rule）**：在一个线程内，按照控制流顺序，书写在前面的操作先行发生于书写在后面的操作。

2. **管程锁定规则（Monitor Lock Rule）**: 线程解锁 m 之前对变量的写，对于接下来对 m 加锁的其它线程对该变量的读可见 **(即synchronized可以保证可见性)**

```java
static int x;
static Object m = new Object();
new Thread(()->{
 synchronized(m) {
 x = 10;
 }
},"t1").start();
new Thread(()->{
 synchronized(m) {
 System.out.println(x);
 }
},"t2").start();
```

3. **volatile 变量规则（Volatile Variable Rule）**:线程对 volatile 变量的写，对接下来其它线程对该变量的读可见 **(即volatile 可以保证可见性)**

```java
volatile static int x;
new Thread(()->{
 x = 10;
},"t1").start();
new Thread(()->{
 System.out.println(x);
},"t2").start();
```

4. **线程启动规则（Thread Start Rule）**：线程 start 前对变量的写，对该线程开始后对该变量的读可见

   这个例子中 updater 线程修改了stop，但是对 getter线程不可见，因此getter线程不会输出`getter stopped."` ,将` getter.start();` 语句放到 `stop = true;`的后面，即可得到正确结果

   ```java
   package leftover;
   
   import lombok.extern.slf4j.Slf4j;
   
   @Slf4j
   public class happens_before {
   
       private static boolean stop = false;
   
       public static void main(String[] args) {
           Thread getter = new Thread(new Runnable() {
               @Override
               public void run() {
                   while (true) {
                       if (stop) {
                           System.out.println("getter stopped.");
                           break;
                       }
                   }
               }
           }, "getter");
   
           Thread updater = new Thread(new Runnable() {
               @Override
               public void run() {
                   getter.start();
                   try {
                       Thread.sleep(1000);
                   } catch (InterruptedException e) {
                       throw new RuntimeException(e);
                   }
                   stop = true;
                   System.out.println("updater set stop true.");
   
                   while (true) {
                   }
               }
           });
           updater.start();
       }
   
   }
   
   ```

5. **线程终止规则**：线程结束前对变量的写，对其它线程得知它结束后的读可见（比如其它线程调用 t1.isAlive() 或 t1.join()等待

它结束）

```java
public class happens_before {
    static int x;
    static Object m = new Object();

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> {
            x = 10;
        }, "t1");
        t1.start();
		    t1.join();
//          or
//        while (t1.isAlive()) {
//            Thread.yield();
//        }
      
      // 调用了join 或者 isAlive方法判断他是否结束，则读可见 printf 10 ，否则 printf 0
        System.out.println(x);
    }
}

```

6. **线程中断规则**：对线程interrupted()方法的调用 **先行于** 被中断线程的代码检测到中断时间的发生。

```java
public class happens_before {
    static int x;

    public static void main(String[] args) throws InterruptedException {
        Thread t2 = new Thread(() -> {
            while (true) {
                if (Thread.currentThread().isInterrupted()) {
                    System.out.println(x); // 10
                    break;
                }
            }
        }, "t2");
        t2.start();

        new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            x = 10;
            t2.interrupt();
        }, "t1").start();
    }
}

```

7. **对象终结规则（Finalizer Rule）** ：一个对象的初始化完成（构造函数结束）先行发生于它的 finalize()方法的开始

   ```java
   @Slf4j
   public class happens_before {
   
   
       private static boolean stop = false;
   
       public static void main(String[] args) {
           Test test = new Test();
           //test设置为null以后就可以回收了
           test = null;
           while (true) {
               //促使垃圾回收
               byte[] bytes = new byte[1024 * 1024];
           }
       }
   
       static class Test {
           public Test() {
               stop = true;
               System.out.println("set stop true in constructor");
           }
   
           @Override
           protected void finalize() throws Throwable {
               if (stop) {
                   System.out.println("stop true in finalize, threadName  " + Thread.currentThread().getName());
               } else {
                   System.out.println("stop false in finalize, threadName " + Thread.currentThread().getName());
               }
           }
       }
   
   }
   
   ```

   

8. **传递性（Transitivity）**：如果操作 A 先行发生于操作 B，操作 B 先行发生于操作 C，那就可以得出操作 A 先行发生于操作 C 的结论。



巨人的肩膀：[Happens-Before 原则深入解读](https://xie.infoq.cn/article/d0f4d9e812ee03b6a32265686)



# 原子类

## CAS

### 什么是CAS？

​    CAS全称 Compare And Swap （比较并交换）， CAS使用的是一种乐观锁的思想，每次线程操作时都认为自己可以成功执行，但当多个线程同时使用CAS操作一个变量时，只有一个会成功执行并成功更新，其他线程均会失败，但是失败的线程不会被挂起，会被告知没有swap成功，线程可以继续重试，也可以放弃操作。

​	CAS方法有3个参数（expect，offset，update）-> 旧的值，旧值对应的内存地址，新值 ；当swap之前会取出对应内存中的值进行判断，是否与旧的值一致，若一致，则替换成功；若不是，则不替换

>##  底层原理
>
>1. 其实 CAS 的底层是 lock cmpxchg 指令（X86 架构），CMPXCHG是“Compare and Exchange”的缩写，是原子指令，在单核 CPU 和多核 CPU 下都能够保证【比较-交换】的原子性
>
>2. 在多核状态下，某个核执行到带 lock 的指令时，CPU 会让总线锁住，当这个核把此指令执行完毕，再开启总线。这个过程中不会被线程的调度机制所打断，保证了多个线程对内存操作的准确性，是原子的。

### CAS的特点

- 因为CAS不会上锁，因此不会发生死锁

- 结合CAS和volatile 可以实现无锁并发，适用于线程数少，多核CPU的场景

  >1. CAS操作通常会在失败时自旋重试，而不是阻塞线程。自旋操作在大多数情况下能更快地完成，因为避免了线程的上下文切换。
  >
  >2. 线程要想一直保持运行，需要额外CPU的支持，若CPU少，那么线程还是会因为没有分到时间片而进入Runnable（Ready）状态，从而导致上下文切换，会产生比较大的开销
  >
  >3. 如果线程数比较多，会经常出现CAS失败的情况，这样自旋的次数就会增多
  >
  >4. CAS使用的是乐观锁的思想，大多数情况下可以直接成功
  >
  >**综上：** CAS+ volatile 实现无锁并发，适用于并发度不是特别高，多核CPU的场景

  

### CAS的三大问题

#### ABA问题

#### 长时间自旋

#### 多个共享变量的原子操作

#  变量的线程安全分析

<img src="https://img.leftover.cn/img-md/202407201258809.png" alt="image-20240720125805140" style="zoom:50%;" />

# 并发设计模式

## 两段式终止模式

```java
@Slf4j
public class Monitor {
    private static Thread monitor;
  // 保证可见性
    private volatile boolean stop = false;

    public void stop() {
        stop = true;
        monitor.interrupt();
    }

    public void beforeExit() {
        log.info("处理后事");
    }

    public void start1() throws InterruptedException {
        monitor = new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    if (stop) {
                      
                        beforeExit();
                        return;
                    }

                    try {
                        Thread.sleep(1000);
                        log.info("执行监控逻辑");
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                 
                }
            }
        }, "monitor");
        monitor.start();
    }

    public static void main(String[] args) throws InterruptedException {
        Monitor monitor = new Monitor();
        monitor.start1();


        Thread.sleep(1000);

        new Thread(new Runnable() {
            @Override
            public void run() {
                monitor.stop();
            }
        }, "t1").start();
    }
}

```



## Balking（犹豫）模式

Balking（犹豫）模式用于一个线程发现另一个线程或本线程已经做了某一件相同的事，那么本线程就无需再做了，直接return；有点类似单例模式

还是这个监视器的例子，为了防止多次调用监视器的start方法，我们可以添加一个starting变量，使用synchronized来防止线程安全的问题

```java
@Slf4j
public class Monitor {
    private static Thread monitor;
    private volatile boolean stop = false;

  // 判断是否已经start
    private  boolean starting = false;

    public void stop() {
        stop = true;
        starting = false;
        monitor.interrupt();
    }

    public void beforeExit() {
        log.info("处理后事");
    }

 
    public void start1() throws InterruptedException {
      // 防止线程安全问题
        synchronized (this) {
          // 如果已经start，则直接return
            if (starting) {
                return;
            }
            starting = true;
        }
        monitor = new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    if (stop) {
                        beforeExit();
                        stop = false;
                        return;
                    }

                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                    log.info("执行监控逻辑");
                }
            }
        }, "monitor");
        monitor.start();
    }
}
```



## 消费者、生产者模型

```java
public class 生产者消费者模型 {
    public static void main(String[] args) {

    }
}


// 消息队列
class MessageQueue {
  // 消息队列，存放消息
    private final Queue<Message> queue = new LinkedList<>();
  // 消息队列的容量
    private final int capcity;

    public MessageQueue(int capcity) {
        this.capcity = capcity;
    }

    // 获取消息
    public Message take() throws InterruptedException {

        synchronized (queue) {
            while (queue.isEmpty()) {
                queue.wait();
            }
        }
        Message message = queue.poll();
        queue.notifyAll();
        return message;
    }

    // 存入消息
    public void put(Message message) throws InterruptedException {
        synchronized (queue) {
            while (queue.size() >= capcity) {
                queue.wait();
            }
        }
        queue.add(message);
        queue.notifyAll();
    }
}


@ToString
@Getter
@Setter
@AllArgsConstructor
// 消息类
class Message {
    private Integer id;
    private Object value;
}
```

# 常见的线程安全类

String 、Integer、StringBuffer、Random、Vector、HashTable、java.util.concurrent包下的类

