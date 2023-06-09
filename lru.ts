class Node<T, U> {
  key: T;
  value: U;
  next: Node<T, U> | null = null;
  prev: Node<T, U> | null = null;

  constructor(key: T, value: U) {
    this.key = key;
    this.value = value;
  }
}

class LRUCache<T, U> {
  private capacity: number;
  private map = new Map<T, Node<T, U>>();
  private head: Node<T, U>;
  private tail: Node<T, U>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.head = new Node<T, U>(null as any, null as any);
    this.tail = new Node<T, U>(null as any, null as any);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: T): U | undefined {
    const node = this.map.get(key);
    if (node) {
      this.remove(node);
      this.append(node);
      return node.value;
    } else {
      return undefined;
    }
  }

  put(key: T, value: U): void {
    const node = this.map.get(key);
    if (node) {
      this.remove(node);
    } else if (this.map.size === this.capacity) {
      this.map.delete(this.head.next!.key);
      this.remove(this.head.next!);
    }
    const newNode = new Node(key, value);
    this.map.set(key, newNode);
    this.append(newNode);
  }

  private remove(node: Node<T, U>): void {
    const prevNode = node.prev!;
    const nextNode = node.next!;
    prevNode.next = nextNode;
    nextNode.prev = prevNode;
  }

  private append(node: Node<T, U>): void {
    const lastNode = this.tail.prev!;
    lastNode.next = node;
    this.tail.prev = node;
    node.prev = lastNode;
    node.next = this.tail;
  }
}

export default LRUCache;
