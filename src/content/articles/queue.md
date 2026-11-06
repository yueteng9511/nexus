---
title: Queue
description: 先進先出（FIFO）的資料結構，從尾端加入、從前端取出，是排程與廣度優先搜尋的基礎。
category: data-structures
keywords: [佇列, 隊列, FIFO, first in first out, 先進先出, enqueue, dequeue, std::queue, circular buffer, 環狀佇列, BFS]
difficulty: beginner
related: [stack, linked-list, array]
publishedAt: 2026-11-05T22:28:00+08:00
---

## Overview

**Queue**（佇列）是一種**先進先出**（FIFO, First In First Out）的資料結構：最早放進去的元素，會最先被拿出來。

它有兩端：從**尾端**（back / rear）加入，從**前端**（front）取出。

| 操作 | 作用 | 時間 |
|---|---|---|
| `enqueue(x)` / `push(x)` | 把 x 加到尾端 | O(1) |
| `dequeue()` / `pop()` | 移除前端元素 | O(1) |
| `front()` | 查看前端元素 | O(1) |
| `empty()` | 是否為空 | O(1) |

Queue 和 Stack 是一對：Stack 處理「最近的先做」，Queue 處理「先來的先做」。凡是需要**公平地依照到達順序處理**的場合都用得到：作業系統的工作排程、印表機的列印佇列、網路封包緩衝、鍵盤輸入緩衝，以及圖論中的**廣度優先搜尋**（BFS）。

## Intuition

想像在飲料店**排隊**：

- 新來的客人排到隊伍**最後面**（enqueue）。
- 店員服務隊伍**最前面**的客人，服務完他就離開（dequeue）。
- 沒有人可以插隊，先到的人一定先被服務。

另一個例子是**印表機**：大家依序送出列印工作，印表機一份一份照送出的順序印。後送的人只能等前面的印完。

## How It Works

### 為什麼不能直接用陣列開頭當前端

最直覺的做法是用 `vector`：`push_back` 加到尾端，`erase(begin())` 從開頭移除。但移除開頭元素後，**後面所有元素都要往前搬一格**，dequeue 變成 O(n)。處理 n 個元素總共要 O(n²)。

另一種想法是不搬移，只用一個 `head` 索引記住前端在哪，每次 dequeue 就 `head++`。這樣 dequeue 是 O(1)，但陣列前面被取走的位置**永遠空著不能再用**，空間會一直浪費下去。

### 環狀佇列（Circular Buffer）

解法是把陣列想成**頭尾相接的一個環**：

- 用 `head` 記錄前端的索引，`count` 記錄目前有幾個元素。
- 尾端的下一格是 `(head + count) % capacity`。用 `%` 取餘數，索引超過陣列尾端時就**繞回 0**，重新使用前面空出來的位置。
- dequeue 只要 `head = (head + 1) % capacity`、`count--`，**不搬移任何元素**。

以容量 4 為例：

| 操作 | head | count | 陣列內容（_ 代表空位） |
|---|---|---|---|
| enqueue 1, 2, 3 | 0 | 3 | `1 2 3 _` |
| dequeue × 2 | 2 | 1 | `_ _ 3 _` |
| enqueue 4 | 2 | 2 | `_ _ 3 4` |
| enqueue 5（繞回索引 0） | 2 | 3 | `5 _ 3 4` |

此時佇列的順序是 3 → 4 → 5：從 `head` 開始往後讀，讀到尾端再繞回開頭。

> 為什麼要記 `count`？如果只記 `head` 和 `tail` 兩個索引，「空」和「滿」的時候都會出現 `head == tail`，無法分辨。常見的解法是多記一個 `count`，或是故意留一格永遠不用。

### `std::queue` 與 `std::deque`

C++ 的 `std::queue` 和 `std::stack` 一樣是**容器轉接器**，預設底層用 `std::deque`（double-ended queue，雙端佇列）。`deque` 兩端都能 O(1) 插入與刪除，內部是由多塊固定大小的陣列組成，不需要像環狀佇列那樣自己處理繞回。

### 應用：廣度優先搜尋（BFS）

BFS 從起點出發，**先拜訪所有距離 1 的點，再拜訪距離 2 的點**，一層一層往外擴散。Queue 正好保證這個順序：先發現的點先處理，所以距離近的點一定比距離遠的點先出隊。這也是 BFS 能在無權重圖上求出最短距離的原因。

## Implementation

### 環狀佇列

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

class CircularQueue {
public:
    explicit CircularQueue(int capacity) : data(capacity), head(0), count(0) {}

    bool enqueue(int v) {
        if (full()) return false;
        int tail = (head + count) % capacity();  // 隊尾的下一格，超過尾端就繞回 0
        data[tail] = v;
        ++count;
        return true;
    }

    bool dequeue() {
        if (empty()) return false;
        head = (head + 1) % capacity();  // 前端往後移一格，不搬移任何元素
        --count;
        return true;
    }

    int front() const { return data[head]; }  // 呼叫前要先確認不是空的
    bool empty() const { return count == 0; }
    bool full() const { return count == capacity(); }
    int capacity() const { return static_cast<int>(data.size()); }

    void debug() const {  // 印出內部陣列，觀察「繞回」
        cout << "head=" << head << " count=" << count << " data=[";
        for (int i = 0; i < capacity(); ++i) {
            bool used = (i - head + capacity()) % capacity() < count;
            cout << (used ? to_string(data[i]) : string("_")) << (i + 1 < capacity() ? " " : "");
        }
        cout << "]\n";
    }

private:
    vector<int> data;
    int head;   // 前端的索引
    int count;  // 目前元素個數
};

int main() {
    CircularQueue q(4);
    for (int v : {1, 2, 3}) q.enqueue(v);
    q.debug();

    q.dequeue();
    q.dequeue();
    q.debug();

    q.enqueue(4);
    q.enqueue(5);  // 尾端已經用完，繞回索引 0
    q.debug();

    cout << boolalpha;
    cout << "enqueue(6) -> " << q.enqueue(6) << '\n';
    cout << "enqueue(7) -> " << q.enqueue(7) << " (full)\n";
    cout << "front = " << q.front() << '\n';
}
```

```text
head=0 count=3 data=[1 2 3 _]
head=2 count=1 data=[_ _ 3 _]
head=2 count=3 data=[5 _ 3 4]
enqueue(6) -> true
enqueue(7) -> false (full)
front = 3
```

`debug()` 裡的 `(i - head + capacity()) % capacity()` 算的是「索引 i 距離前端幾格」。先加上 `capacity()` 是為了避免負數，因為 C++ 中負數取餘數的結果也是負的。

### BFS：用 `std::queue` 求最短距離

```cpp
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    // 無向圖的鄰接串列，邊為：0-1, 0-2, 1-3, 2-3, 3-4
    vector<vector<int>> adj = {{1, 2}, {0, 3}, {0, 3}, {1, 2, 4}, {3}};
    vector<int> dist(adj.size(), -1);  // -1 表示還沒發現

    queue<int> q;
    dist[0] = 0;
    q.push(0);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        cout << "visit " << u << " (distance " << dist[u] << ")\n";
        for (int v : adj[u]) {
            if (dist[v] == -1) {  // 第一次發現 v：距離就此確定，排進佇列
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
}
```

```text
visit 0 (distance 0)
visit 1 (distance 1)
visit 2 (distance 1)
visit 3 (distance 2)
visit 4 (distance 3)
```

拜訪順序是一層一層往外：先是距離 0，接著是兩個距離 1 的點，然後是距離 2、距離 3。

## Complexity

| 操作 | 環狀佇列 | `std::queue`（deque） | `vector` + `erase(begin())` |
|---|---|---|---|
| enqueue | O(1) | O(1) | 攤銷 O(1) |
| dequeue | O(1) | O(1) | **O(n)** |
| front | O(1) | O(1) | O(1) |

**空間複雜度**：O(n)。環狀佇列的容量固定，滿了就不能再加入；需要自動擴充時，要配置更大的陣列並把元素依序複製過去（和 `vector` 擴容的概念相同）。

BFS 的時間複雜度是 O(V + E)：每個點進出佇列各一次，每條邊被檢查常數次。

## Common Mistakes

**1. 用 `vector::erase(begin())` 當 dequeue**

每次都要搬移所有元素，n 次 dequeue 總共 O(n²)。資料量大時會超時。用 `std::queue` 或環狀佇列。

**2. 以為 `pop()` 會回傳前端元素**

和 `std::stack` 一樣，`std::queue::pop()` 回傳 `void`。要先 `front()` 取值再 `pop()`。對空佇列呼叫 `front()` 或 `pop()` 是未定義行為。

**3. 環狀佇列分不清「空」和「滿」**

只用 `head`、`tail` 兩個索引時，空和滿都是 `head == tail`。要多記一個 `count`，或保留一格不用（滿的條件改成 `(tail + 1) % capacity == head`）。

**4. 忘記負數取餘數的結果是負的**

C++ 中 `-1 % 4` 的結果是 `-1`，不是 `3`。往回計算索引時要寫成 `(i - 1 + capacity) % capacity`。

**5. BFS 在「出隊時」才標記已拜訪**

如果等到從佇列取出時才標記，同一個點可能在被取出前就被不同的鄰居重複加入佇列很多次，浪費時間，甚至算錯距離。應該像上面的程式一樣，在**加入佇列的當下**就標記。

**6. 搞混 `queue` 與 `priority_queue`**

`std::priority_queue` 雖然名字有 queue，但它**不是** FIFO：每次取出的是優先度最高（預設是最大）的元素，底層是 Heap。
