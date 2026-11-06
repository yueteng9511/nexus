---
title: Array
description: 把相同型別的元素存放在一段連續記憶體中，透過索引在 O(1) 時間直接存取任何位置。
category: data-structures
keywords: [陣列, 動態陣列, vector, std::vector, 連續記憶體, random access, 隨機存取, index, 索引]
difficulty: beginner
related: [linked-list, stack, queue, binary-search, hash-table]
featured: true
publishedAt: 2026-11-05T21:55:00+08:00
---

## Overview

**Array**（陣列）是最基本的資料結構：把 `n` 個**相同型別**的元素，**緊密地**排在一段**連續的記憶體**裡，並用從 0 開始的**索引**（index）存取。

它最大的優點是**隨機存取（random access）**：不管陣列多長，讀寫第 `i` 個元素都只要 O(1)。代價是**在中間插入或刪除很慢**，因為後面的元素必須整批搬移。

在 C++ 裡有兩種常見形式：

- **靜態陣列** `int a[10];`：大小在編譯時決定，之後不能改變。
- **動態陣列** `std::vector<int>`：大小可以增長，空間不夠時會自動搬到更大的記憶體。實務上幾乎都用它。

許多其他結構都是建立在陣列之上，例如 Stack、Queue、Heap、Hash Table。

## Intuition

想像宿舍一樓的**一整排信箱**，信箱從 0 號開始編號、每個信箱寬度都一樣。

- 要找 37 號信箱，你不需要從 0 號一個個數過去：知道第一個信箱的位置、知道每個信箱多寬，就能**直接走到** 37 號。這就是 O(1) 隨機存取。
- 但如果要在 5 號和 6 號之間**塞進一個新信箱**，就得把 6 號以後的信箱**全部往右挪一格**。信箱越多，越費工。這就是插入的 O(n)。
- 整排信箱是在蓋樓時一次做好的，數量固定。要更多信箱，只能**另外找一面更長的牆，全部搬過去**。這就是動態陣列擴容的概念。

## How It Works

### 位址計算：為什麼存取是 O(1)

陣列名稱代表第一個元素的起始位址（base address）。因為每個元素大小相同、而且連續排列，第 `i` 個元素的位址可以直接算出來：

```text
address(a[i]) = base + i × sizeof(T)
```

例如 `int a[5]` 從位址 `1000` 開始，`int` 佔 4 bytes：

| 索引 | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| 位址 | 1000 | 1004 | 1008 | 1012 | 1016 |

存取 `a[3]` 只要算 `1000 + 3 × 4 = 1012`：一次乘法、一次加法，跟陣列長度無關。這也解釋了**為什麼索引從 0 開始**：索引其實是「距離起點幾個元素」，第一個元素距離起點 0 個。

### 插入與刪除：為什麼是 O(n)

元素必須保持連續，中間不能有空洞。

- **在索引 `k` 插入**：先把 `a[k..n-1]` 全部往右移一格（要**從尾端往前**搬，否則會覆蓋還沒搬的資料），再把新值放進 `a[k]`。
- **刪除索引 `k`**：把 `a[k+1..n-1]` 全部往左移一格，覆蓋掉被刪的元素。

最壞情況（在開頭插入或刪除）要搬 n 個元素，所以是 O(n)。在**尾端**操作則不用搬任何東西。

### 動態陣列如何「變大」

`std::vector` 內部維護三個量：指向資料的指標、目前元素數 `size`、已配置的空間 `capacity`。

1. `push_back` 時若 `size < capacity`，直接放到尾端：O(1)。
2. 若 `size == capacity`，就配置一塊**更大**的記憶體（GCC 是 2 倍，MSVC 是 1.5 倍），把舊元素**全部複製過去**，再釋放舊空間：這一次是 O(n)。

因為容量是**倍數成長**，昂貴的複製很少發生。把 n 次 `push_back` 的總成本平均下來，每次只要 O(1)，這叫做**攤銷（amortized）O(1)**。

> 以 2 倍成長為例：放入 n 個元素時，複製的總次數約為 1 + 2 + 4 + … + n/2 < n。總工作量 O(n)，分攤到 n 次操作，每次 O(1)。

### 連續記憶體與 CPU 快取

CPU 從記憶體讀資料時，一次會載入一整段（cache line，通常 64 bytes）。陣列元素連續排列，讀 `a[0]` 時 `a[1]`、`a[2]`… 往往已經在快取裡了。所以**依序走訪陣列非常快**，實際速度常常遠勝同樣是 O(n) 的 Linked List。

## Implementation

### 靜態陣列：手動插入與刪除

下面的程式用固定容量的陣列，加上一個 `size` 變數記錄目前用了幾格，實作插入與刪除。這正是 `std::vector` 在底層做的事（少了自動擴容）。

```cpp
#include <iostream>
using namespace std;

const int CAPACITY = 10;

// 在 arr[index] 插入 value。size 以參考傳入，函式會更新它。
bool insertAt(int arr[], int& size, int index, int value) {
    if (size == CAPACITY || index < 0 || index > size) return false;
    for (int i = size; i > index; --i) {  // 從尾端往前，把元素往右搬一格
        arr[i] = arr[i - 1];
    }
    arr[index] = value;
    ++size;
    return true;
}

// 刪除 arr[index]
bool eraseAt(int arr[], int& size, int index) {
    if (index < 0 || index >= size) return false;
    for (int i = index; i < size - 1; ++i) {  // 從刪除點往後，把元素往左搬一格
        arr[i] = arr[i + 1];
    }
    --size;
    return true;
}

void print(const int arr[], int size) {
    for (int i = 0; i < size; ++i) {
        cout << arr[i] << (i + 1 < size ? ' ' : '\n');
    }
}

int main() {
    int arr[CAPACITY] = {10, 20, 30, 40};
    int size = 4;

    cout << "arr[2] = " << arr[2] << '\n';  // 隨機存取：O(1)

    insertAt(arr, size, 1, 15);  // 在索引 1 插入 15
    print(arr, size);

    eraseAt(arr, size, 3);       // 刪除索引 3（值 30）
    print(arr, size);

    // 相鄰元素的位址差 = sizeof(int)
    char* p0 = reinterpret_cast<char*>(&arr[0]);
    char* p1 = reinterpret_cast<char*>(&arr[1]);
    cout << "distance = " << (p1 - p0) << " bytes\n";
}
```

```text
arr[2] = 30
10 15 20 30 40
10 15 20 40
distance = 4 bytes
```

最後一行把位址轉成 `char*` 再相減，得到的是相差的 **byte 數**。直接用 `&arr[1] - &arr[0]` 會得到 1，因為指標相減的單位是「元素個數」。

### `std::vector`：實務上的寫法

```cpp
#include <iostream>
#include <stdexcept>
#include <vector>
using namespace std;

int main() {
    vector<int> v;                 // 空的動態陣列
    for (int i = 1; i <= 5; ++i) {
        v.push_back(i * 10);       // 尾端加入：攤銷 O(1)
    }                              // v = 10 20 30 40 50

    v.insert(v.begin() + 1, 15);   // 中間插入：O(n)，後面的元素都要搬
    v.pop_back();                  // 尾端移除：O(1)

    for (size_t i = 0; i < v.size(); ++i) {
        cout << v[i] << (i + 1 < v.size() ? ' ' : '\n');
    }
    cout << "size = " << v.size() << ", v[2] = " << v[2] << '\n';

    // v[i] 不檢查範圍；v.at(i) 越界時會丟出 out_of_range 例外
    try {
        int x = v.at(10);
        cout << x << '\n';
    } catch (const out_of_range&) {
        cout << "v.at(10): out of range\n";
    }

    // 觀察容量如何成長
    vector<int> w;
    size_t lastCapacity = w.capacity();
    for (int i = 0; i < 20; ++i) {
        w.push_back(i);
        if (w.capacity() != lastCapacity) {
            lastCapacity = w.capacity();
            cout << "size " << w.size() << " -> capacity " << lastCapacity << '\n';
        }
    }
}
```

```text
10 15 20 30 40
size = 5, v[2] = 20
v.at(10): out of range
size 1 -> capacity 1
size 2 -> capacity 2
size 3 -> capacity 4
size 5 -> capacity 8
size 9 -> capacity 16
size 17 -> capacity 32
```

容量成長的輸出是 GCC（libstdc++）的結果，每次翻倍。用 MSVC 編譯會看到不同的數字，因為 C++ 標準只規定 `push_back` 必須是攤銷 O(1)，沒有規定成長倍率。

## Complexity

| 操作 | 靜態陣列 | `std::vector` | 說明 |
|---|---|---|---|
| 存取 `a[i]` | O(1) | O(1) | 位址可直接計算 |
| 搜尋（未排序） | O(n) | O(n) | 只能逐一比對 |
| 搜尋（已排序） | O(log n) | O(log n) | 可用 Binary Search |
| 尾端插入 | 不支援擴容 | 攤銷 O(1) | 擴容那一次是 O(n) |
| 開頭 / 中間插入 | O(n) | O(n) | 需要搬移後方元素 |
| 尾端刪除 | O(1) | O(1) | 不需搬移 |
| 開頭 / 中間刪除 | O(n) | O(n) | 需要搬移後方元素 |

**空間複雜度**：O(n)。`std::vector` 的 `capacity` 可能大於 `size`，最多會多佔約一倍的空間，這是用空間換取攤銷 O(1) 插入。

## Common Mistakes

**1. Off-by-one：迴圈多跑一圈**

長度為 `n` 的陣列，合法索引是 `0` 到 `n - 1`。寫成 `for (int i = 0; i <= n; ++i)` 會多存取一個不存在的 `a[n]`。

**2. 以為越界會報錯**

C++ 的 `a[i]` 和 `v[i]` **不檢查範圍**。越界是**未定義行為（undefined behavior）**：程式可能照常執行、讀到垃圾值、改壞其他變數，或直接崩潰。除錯時可以改用 `v.at(i)`，或用 `g++ -fsanitize=address` 編譯來抓出越界。

**3. 陣列傳進函式後，`sizeof` 就不能用來算長度了**

```cpp
void f(int arr[]) {
    // arr 在這裡其實是 int*，sizeof(arr) 是指標大小（通常 8），不是陣列大小
}
```

陣列當參數傳遞時會**退化（decay）成指標**，長度資訊會遺失。所以要另外傳 `size`，或直接改用 `std::vector`（它自己記得 `size()`）。

**4. `push_back` 之後還在用舊的指標、參考或 iterator**

`vector` 擴容時會把資料搬到新位址，**之前取得的指標、參考、iterator 全部失效**。

```cpp
vector<int> v = {1, 2, 3};
int& first = v[0];
v.push_back(4);   // 可能觸發擴容
cout << first;    // 未定義行為：first 可能指向已釋放的記憶體
```

**5. 空的 vector 做 `v.size() - 1`**

`size()` 回傳的是**無號整數** `size_t`。當 `v` 是空的，`v.size() - 1` 不會變成 `-1`，而是變成一個**極大的正數**，例如 `for (size_t i = 0; i < v.size() - 1; ++i)` 會越界。改寫成 `i + 1 < v.size()` 就能避免。

**6. 搞混 `size` 與 `capacity`、`resize` 與 `reserve`**

- `reserve(n)`：只預先配置空間，`size` **不變**，還不能用 `v[i]` 存取這些位置。
- `resize(n)`：真的把元素個數改成 `n`，新元素會被初始化（`int` 是 0）。

已知大概要放多少元素時，先 `reserve` 可以避免多次擴容。
