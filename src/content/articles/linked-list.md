---
title: Linked List
description: 由節點串成的線性結構，每個節點記住下一個節點的位址，插入刪除不需搬移元素。
category: data-structures
keywords: [鏈結串列, 連結串列, 串列, singly linked list, doubly linked list, std::list, forward_list, 節點, node, 指標]
difficulty: beginner
related: [array, stack, queue, hash-table]
publishedAt: 2026-11-05T22:24:00+08:00
---

## Overview

**Linked List**（鏈結串列）把資料存在一個個獨立的**節點**（node）裡。每個節點除了資料，還存一個指向**下一個節點**的指標。節點散落在記憶體各處，靠指標串成一條鏈。

和 Array 正好互補：

- **優點**：只要手上已經有某個節點的位置，在它後面插入或刪除只要改幾個指標，是 O(1)，**不需要搬移其他元素**。串列也可以隨時增長，不用預先配置空間或整批複製。
- **缺點**：不能用索引直接跳到第 `i` 個元素，只能從頭一個一個走過去，是 O(n)。每個節點還要多存指標，節點也不連續，對 CPU 快取不友善。

常見變形：

- **單向串列**（singly linked list）：每個節點只有 `next`。C++ 的 `std::forward_list`。
- **雙向串列**（doubly linked list）：每個節點有 `prev` 和 `next`，可以往回走。C++ 的 `std::list`。

## Intuition

想像一場**尋寶遊戲**：每張紙條上寫著一個線索，以及「下一張紙條藏在哪裡」。

- 你手上只有第一張紙條（`head`）。想看第 5 張，只能從第 1 張開始，照著指示一張張找下去。這就是 O(n) 存取。
- 想在第 2 張和第 3 張之間**加一張新紙條**很容易：把第 2 張的「下一張在哪」改成新紙條的位置，新紙條再指向原本的第 3 張。其他紙條完全不用動。
- 紙條可以藏在任何地方，不需要排在一起。這就是「不需要連續記憶體」。

也可以想成**火車車廂**：每節車廂用連結器勾住下一節。要在中間加掛一節車廂，只需要解開一個連結器、重新勾上兩次。

## How It Works

### 節點結構

```cpp
struct Node {
    int value;   // 資料
    Node* next;  // 下一個節點的位址；最後一個節點的 next 是 nullptr
};
```

串列本身只需要記住第一個節點 `head`。很多實作也會記住最後一個節點 `tail`，讓尾端插入變成 O(1)。

```text
head
 │
 ▼
[10 | ●]──►[20 | ●]──►[30 | ●]──► nullptr
```

### 走訪

從 `head` 開始，沿著 `next` 一直走，走到 `nullptr` 就結束：

```cpp
for (Node* p = head; p != nullptr; p = p->next) {
    // 處理 p->value
}
```

找第 `i` 個元素、搜尋某個值，都要這樣從頭走。所以是 O(n)。

### 插入：改指標的順序很重要

在節點 `prev` 後面插入新節點 `node`：

1. `node->next = prev->next;`：先讓新節點接上後半段。
2. `prev->next = node;`：再讓前一個節點指向新節點。

**順序不能顛倒**。如果先執行第 2 步，`prev->next` 已經被覆蓋，後半段的位址就找不回來了，整段資料會遺失（還會造成記憶體洩漏）。

在開頭插入是特例：新節點的 `next` 指向原本的 `head`，再把 `head` 改成新節點。

### 刪除：需要知道「前一個節點」

要刪除節點 `cur`，必須讓它的**前一個節點**改成指向 `cur->next`，讓 `cur` 被跳過，然後再 `delete cur`。

單向串列無法從 `cur` 往回找前一個節點，所以刪除時通常要一邊走一邊記住 `prev`。雙向串列的節點本身就有 `prev`，所以給定節點就能 O(1) 刪除。這就是 `std::list` 用雙向串列的主要原因。

### 邊界情況

寫串列程式時，大部分 bug 都出在邊界情況。每個操作都要想一遍：

- 串列是**空的**（`head == nullptr`）
- 只有**一個**節點（它同時是 `head` 和 `tail`）
- 操作的是**第一個**或**最後一個**節點

### 和 Array 的比較

| | Array / `vector` | Linked List |
|---|---|---|
| 記憶體配置 | 連續 | 分散，每個節點各自配置 |
| 存取第 i 個 | O(1) | O(n) |
| 已知位置的插入 / 刪除 | O(n)，要搬移 | O(1)，改指標 |
| 額外空間 | 可能有閒置的 capacity | 每個節點多一到兩個指標 |
| 快取效率 | 好 | 差 |

## Implementation

### 單向串列

下面實作一個有 `head` 和 `tail` 的單向串列，包含頭尾插入、刪除指定值、原地反轉。

```cpp
#include <iostream>
using namespace std;

struct Node {
    int value;
    Node* next;
    Node(int v) : value(v), next(nullptr) {}
};

class LinkedList {
public:
    LinkedList() : head(nullptr), tail(nullptr), count(0) {}

    ~LinkedList() {  // 逐一釋放每個節點，避免記憶體洩漏
        while (head != nullptr) {
            Node* next = head->next;
            delete head;
            head = next;
        }
    }

    // 禁止複製：預設的複製只會複製指標，兩個串列會共用節點，解構時會重複 delete
    LinkedList(const LinkedList&) = delete;
    LinkedList& operator=(const LinkedList&) = delete;

    void pushFront(int v) {  // O(1)
        Node* node = new Node(v);
        node->next = head;
        head = node;
        if (tail == nullptr) tail = node;  // 原本是空串列
        ++count;
    }

    void pushBack(int v) {  // O(1)，因為有記住 tail
        Node* node = new Node(v);
        if (tail == nullptr) {
            head = tail = node;
        } else {
            tail->next = node;
            tail = node;
        }
        ++count;
    }

    bool remove(int v) {  // 刪除第一個值為 v 的節點：O(n)
        Node* prev = nullptr;
        Node* cur = head;
        while (cur != nullptr && cur->value != v) {
            prev = cur;
            cur = cur->next;
        }
        if (cur == nullptr) return false;  // 找不到

        if (prev == nullptr) head = cur->next;  // 刪的是第一個節點
        else prev->next = cur->next;            // 讓前一個節點跳過 cur
        if (cur == tail) tail = prev;           // 刪的是最後一個節點
        delete cur;
        --count;
        return true;
    }

    void reverse() {  // 原地反轉：O(n)
        Node* prev = nullptr;
        Node* cur = head;
        tail = head;  // 原本的第一個節點會變成最後一個
        while (cur != nullptr) {
            Node* next = cur->next;  // 先記住下一個，改完指標後就找不到了
            cur->next = prev;
            prev = cur;
            cur = next;
        }
        head = prev;
    }

    void print() const {
        for (Node* p = head; p != nullptr; p = p->next) cout << p->value << " -> ";
        cout << "null (size " << count << ")\n";
    }

private:
    Node* head;
    Node* tail;
    int count;
};

int main() {
    LinkedList list;
    list.pushBack(20);
    list.pushBack(30);
    list.pushFront(10);
    list.print();

    list.remove(20);
    list.print();

    list.pushBack(40);
    list.reverse();
    list.print();

    cout << boolalpha << list.remove(99) << '\n';
}
```

```text
10 -> 20 -> 30 -> null (size 3)
10 -> 30 -> null (size 2)
40 -> 30 -> 10 -> null (size 3)
false
```

`reverse()` 是面試常考題。關鍵是一次只處理一個節點，用三個指標 `prev`、`cur`、`next` 記住位置，把 `cur->next` 反過來指向 `prev`。

### `std::list`：實務上的寫法

```cpp
#include <iostream>
#include <iterator>
#include <list>
using namespace std;

int main() {
    list<int> lst = {10, 20, 30};

    auto it = next(lst.begin());  // 指向 20
    lst.insert(it, 15);           // 在 20 前面插入：O(1)，不需搬移其他元素
    lst.push_front(5);
    lst.erase(it);                // 刪除 20；其他元素的 iterator 仍然有效

    for (int x : lst) cout << x << ' ';
    cout << '\n';
}
```

```text
5 10 15 30
```

`std::list` 不支援 `lst[i]`。標準庫故意不提供 O(n) 的索引運算，避免你誤以為它很快。

## Complexity

| 操作 | 單向串列 | 雙向串列 | 說明 |
|---|---|---|---|
| 存取第 i 個 | O(n) | O(n) | 只能從頭走 |
| 搜尋 | O(n) | O(n) | |
| 開頭插入 / 刪除 | O(1) | O(1) | |
| 尾端插入 | O(1) | O(1) | 需要記住 `tail` |
| 尾端刪除 | O(n) | O(1) | 單向串列要找到倒數第二個 |
| 在已知節點後插入 | O(1) | O(1) | |
| 刪除已知節點 | O(n) | O(1) | 單向串列要先找到前一個節點 |

**空間複雜度**：O(n)。每個節點額外存一個（單向）或兩個（雙向）指標，在 64 位元系統上每個指標佔 8 bytes，存 `int` 這種小資料時，指標占的空間比資料本身還多。

## Common Mistakes

**1. 改指標的順序錯誤，弄丟後半段**

插入時要**先**讓新節點接上後面（`node->next = prev->next`），**再**讓前面接上新節點。反過來寫，後半段的位址會被覆蓋而遺失。

**2. 對 `nullptr` 取值**

`cur->next` 在 `cur == nullptr` 時會讓程式崩潰。條件的順序也很重要：`while (cur != nullptr && cur->value != v)` 是對的，因為 `&&` 左邊為 false 時右邊不會執行（short-circuit）。寫成 `cur->value != v && cur != nullptr` 就會出錯。

**3. 先 `delete` 再使用**

```cpp
delete cur;
cur = cur->next;   // 未定義行為：cur 指向的記憶體已經釋放
```

要先用變數存下 `cur->next`，再 `delete cur`。

**4. 忘記更新 `head` 或 `tail`**

刪除第一個節點時要更新 `head`，刪除最後一個節點時要更新 `tail`，從一個元素變成空串列時兩個都要變成 `nullptr`。邊界情況請逐一測試。

**5. 以為串列插入「永遠」是 O(1)**

O(1) 的前提是**已經拿到那個位置的節點**。如果要「在第 i 個位置插入」，光是走到第 i 個就要 O(n)。

**6. 以為串列一定比 `vector` 快**

理論上串列中間插入是 O(1)，但節點分散在記憶體各處，每走一步都可能 cache miss。實測上，即使有大量插入，`vector` 也常常比 `std::list` 快。除非真的需要「已知位置 O(1) 插入刪除」或「iterator 永遠不失效」，否則優先用 `vector`。
