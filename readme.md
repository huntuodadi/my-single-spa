# 微前端架构的实现及应用

## 现有问题回顾

1. 随着项目的迭代，功能堆积的越来越多，产品在设计上并没有考虑按功能分割出不同应用，导致工程越来越大，测试打包部署都需要很长时间；有时一个很小的bug修复却要打包其他无关的模块。

2. 有时想在独立的新功能上应用新技术，但由于包的升级或者引入新技术会影响老旧的模块而不得不做出妥协。

3. 如果自己模块因为某些原因要回退到某个历史版本，不能简单的回退因为中间会有其他模块的代码merge进来。

4. ... ...

## 微前端是什么

如果将大应用按照某种标准拆分成若干个小应用，每个应用都能独立开发独立部署，再由一个主应用去管理这些子应用，那上面这些问题都能解决。这也就是微前端要解决的核心问题。

## 微前端的几种实现形式

1. 路由分发
https://zhuanlan.zhihu.com/p/79388540

https://www.jianshu.com/p/41ab812df9e7

https://segmentfault.com/a/1190000022643178

https://micro-frontends.org/#:~:text=The%20term%20Micro%20Frontends%20first%20came%20up%20in,sits%20on%20top%20of%20a%20micro%20service%20architecture.