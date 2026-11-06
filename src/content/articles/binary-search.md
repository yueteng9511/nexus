---
title: Binary Search
description: 在已排序的資料中，每一步比較中間元素並排除一半範圍，以 O(log n) 時間找到目標。
category: algorithms
keywords: [二分搜尋, 二分搜尋法, 二分查找, lower_bound, upper_bound, O(log n), 對答案二分, divide and conquer]
difficulty: beginner
related: [array, binary-search-tree]
featured: true
publishedAt: 2026-11-05T22:30:00+08:00
---

## Overview

**Binary Search**（二分搜尋）用來在**已排序**的資料中找東西。每一步都看範圍正中間的元素：

- 剛好是目標：找到了。
- 比目標小：目標只可能在**右半邊**，左半邊整個丟掉。
- 比目標大：目標只可能在**左半邊**，右半邊整個丟掉。

每比較一次，範圍就縮小一半，所以最多只要比較約 log₂ n 次。100 萬筆資料只要約 20 次，10 億筆也只要約 30 次。逐一比對的線性搜尋則要 O(n) 次。

二分搜尋的前提有兩個：

1. 資料**已排序**（更精確地說：判斷條件具有**單調性**，見下方「對答案二分」）。
2. 可以 O(1) **隨機存取**中間元素，所以通常用在 Array 上，而不是 Linked List。

## Intuition

**猜數字遊戲**：對方心中想一個 1 到 100 的整數，你每猜一次，他會說「太大」或「太小」。

- 從 1 開始一個個猜，最壞要猜 100 次。
- 每次都猜**剩下範圍的中間**：先猜 50，「太大」，範圍剩 1–49；猜 25，「太小」，剩 26–49；猜 37……每次排除一半，**最多 7 次**就一定猜中，因為 2⁷ = 128 ≥ 100。

查**紙本字典**也是同樣的道理：要找 "queue"，你會翻到中間附近，看到 "m" 開頭就知道要往後翻，而不會從第一頁開始逐頁翻。

## How It Works

### 範圍與不變量

寫二分搜尋最重要的是先決定**搜尋範圍的定義**，並在整個過程中維持它（這叫做**不變量**，invariant）。最常見的寫法是閉區間 `[lo, hi]`：

- 不變量：「如果目標存在，它一定在 `a[lo..hi]` 之中」。
- 初始：`lo = 0`、`hi = n - 1`。
- 迴圈條件：`lo <= hi`（範圍內還有元素）。
- `a[mid] < target`：mid 和它左邊都不可能是答案，所以 `lo = mid + 1`。
- `a[mid] > target`：`hi = mid - 1`。
- 迴圈結束（`lo > hi`）代表範圍是空的，目標不存在。

### 逐步追蹤

在 `a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]` 中找 23：

| 步驟 | lo | hi | mid | a[mid] | 判斷 |
|---|---|---|---|---|---|
| 1 | 0 | 9 | 4 | 16 | 16 < 23，往右：lo = 5 |
| 2 | 5 | 9 | 7 | 56 | 56 > 23，往左：hi = 6 |
| 3 | 5 | 6 | 5 | 23 | 找到，回傳 5 |

10 個元素只比較了 3 次。

### 計算 mid：避免溢位

直覺的寫法 `mid = (lo + hi) / 2` 在 `lo + hi` 超過 `int` 上限（約 21 億）時會**溢位**變成負數。安全的寫法是：

```cpp
int mid = lo + (hi - lo) / 2;
```

`hi - lo` 一定不會溢位，結果和原本的寫法相同。

### lower_bound 與 upper_bound

實務上更常用的不是「找到就好」，而是找**邊界**：

- `lower_bound(x)`：第一個 **≥ x** 的位置。
- `upper_bound(x)`：第一個 **> x** 的位置。

例如 `b = [1, 3, 3, 3, 5, 8]`：`lower_bound(3) = 1`、`upper_bound(3) = 4`，兩者相減就是 3 出現的次數。x 不存在時，`lower_bound` 回傳的就是「x 應該插入的位置」。

找邊界時用**半開區間** `[lo, hi)` 比較自然：

- `a[mid] < x`：mid 不可能是答案，`lo = mid + 1`。
- 否則：mid **可能**就是答案，不能丟掉，所以 `hi = mid`（不是 `mid - 1`）。
- 迴圈在 `lo == hi` 時結束，這個位置就是答案。

### 對答案二分

二分搜尋不只能用在陣列上。只要有一個**單調**的判斷條件：「x 可行，則所有比 x 小的值也可行」，就能用二分搜尋找出**最大的可行值**。

例如「找最大的 x 使得 x² ≤ n」：x 越大 x² 越大，條件從「成立」變成「不成立」只會發生一次，所以可以二分。這類技巧在競賽與面試中非常常見，稱為**對答案二分**。

## Implementation

### 搜尋與 lower_bound

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// 在已排序的 a 中找 target，找到回傳索引，找不到回傳 -1
int binarySearch(const vector<int>& a, int target) {
    int lo = 0, hi = static_cast<int>(a.size()) - 1;  // 搜尋範圍 [lo, hi]（閉區間）
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;  // 避免 lo + hi 溢位
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;  // 答案只可能在右半邊
        else hi = mid - 1;                  // 答案只可能在左半邊
    }
    return -1;
}

// 第一個 >= target 的位置（與 std::lower_bound 相同），範圍 [lo, hi)（半開區間）
int lowerBound(const vector<int>& a, int target) {
    int lo = 0, hi = static_cast<int>(a.size());
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < target) lo = mid + 1;  // mid 不可能是答案
        else hi = mid;                      // mid 可能是答案，保留它
    }
    return lo;  // lo == hi；所有元素都 < target 時會等於 a.size()
}

int main() {
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    cout << "search 23 -> index " << binarySearch(a, 23) << '\n';
    cout << "search 7  -> index " << binarySearch(a, 7) << '\n';

    vector<int> b = {1, 3, 3, 3, 5, 8};
    cout << "lowerBound(3) = " << lowerBound(b, 3) << '\n';
    cout << "lowerBound(4) = " << lowerBound(b, 4) << '\n';
    cout << "lowerBound(9) = " << lowerBound(b, 9) << '\n';

    // STL 版本：計算 3 出現幾次
    auto first = lower_bound(b.begin(), b.end(), 3);  // 第一個 >= 3
    auto last = upper_bound(b.begin(), b.end(), 3);   // 第一個 > 3
    cout << "count of 3 = " << (last - first) << '\n';
}
```

```text
search 23 -> index 5
search 7  -> index -1
lowerBound(3) = 1
lowerBound(4) = 4
lowerBound(9) = 6
count of 3 = 3
```

`lowerBound(4) = 4` 代表 4 不存在，但如果要插入，應該放在索引 4（3 和 5 之間），陣列才會維持排序。

### 對答案二分：整數平方根

```cpp
#include <iostream>
using namespace std;

// 回傳最大的 x，使得 x * x <= n（n >= 0）
long long isqrt(long long n) {
    // 不變量：lo 一定可行（lo*lo <= n），hi 一定不可行（hi*hi > n）
    long long lo = 0, hi = n + 1;
    while (hi - lo > 1) {  // 還沒縮到相鄰
        long long mid = lo + (hi - lo) / 2;
        if (mid <= n / mid) lo = mid;  // 等價於 mid*mid <= n，用除法避免乘法溢位
        else hi = mid;
    }
    return lo;
}

int main() {
    for (long long n : {0LL, 1LL, 15LL, 16LL, 17LL, 1000000000000000000LL}) {
        cout << "isqrt(" << n << ") = " << isqrt(n) << '\n';
    }
}
```

```text
isqrt(0) = 0
isqrt(1) = 1
isqrt(15) = 3
isqrt(16) = 4
isqrt(17) = 4
isqrt(1000000000000000000) = 1000000000
```

這個寫法用「`lo` 永遠可行、`hi` 永遠不可行」當不變量，迴圈在兩者相鄰時停止，答案就是 `lo`。不需要思考 `+1`、`-1`，是很不容易寫錯的模板。

## Complexity

| 方法 | 時間 | 空間 | 前提 |
|---|---|---|---|
| 線性搜尋 | O(n) | O(1) | 無 |
| 二分搜尋（迴圈） | O(log n) | O(1) | 已排序、可隨機存取 |
| 二分搜尋（遞迴） | O(log n) | O(log n) | 遞迴佔用呼叫堆疊 |
| 先排序再二分 | O(n log n) + O(log n) | 依排序法 | 需要搜尋很多次時才划算 |

每一步範圍減半：n → n/2 → n/4 → … → 1，共 log₂ n 步。

| n | 線性搜尋最多比較 | 二分搜尋最多比較 |
|---|---|---|
| 1,000 | 1,000 | 10 |
| 1,000,000 | 1,000,000 | 20 |
| 1,000,000,000 | 1,000,000,000 | 30 |

## Common Mistakes

**1. 資料沒有排序**

對未排序的陣列做二分搜尋，結果沒有意義。程式不會報錯，只會安靜地回傳錯誤答案。

**2. `(lo + hi) / 2` 溢位**

`lo` 和 `hi` 都很大時，相加會超過 `int` 上限。改用 `lo + (hi - lo) / 2`。

**3. 混用區間寫法，造成無窮迴圈或漏掉元素**

閉區間 `[lo, hi]` 要搭配 `while (lo <= hi)`、`lo = mid + 1`、`hi = mid - 1`；半開區間 `[lo, hi)` 要搭配 `while (lo < hi)`、`hi = mid`。例如在閉區間寫法中用了 `hi = mid`，當 `lo == hi` 時範圍不再縮小，就會無窮迴圈。**選定一種寫法，所有更新都遵守同一個定義。**

**4. 沒檢查 `lower_bound` 的結果就取值**

目標比所有元素都大時，`std::lower_bound` 回傳 `end()`，直接 `*it` 是未定義行為。要先確認 `it != v.end()`，再確認 `*it == target`。

**5. 對 Linked List 做二分搜尋**

串列無法 O(1) 取得中間元素，每次找 mid 都要 O(n)，整體反而比線性搜尋更慢。

**6. 判斷條件沒有單調性**

對答案二分時，必須確定條件只會從「成立」變成「不成立」一次。條件忽真忽假時，二分搜尋會給出錯誤答案。
