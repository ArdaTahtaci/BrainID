// src/services/merkle.ts
import { Level } from 'level'
import { IMT } from '@zk-kit/imt'
import { poseidon2 } from 'poseidon-lite'

// Ağaç derinliği ve default zero value
const TREE_DEPTH = parseInt(process.env.MERKLE_TREE_DEPTH || '20', 10)
const DB_PATH = process.env.DB_PATH || './data/db'
const ZERO_VALUE = BigInt(0)

// LevelDB örneği (JSON encode)
const db = new Level(DB_PATH, { valueEncoding: 'json' })

// IMT instance’ı ve init flag
let tree: IMT
let initialized = false

/**
 * 1) Ağaç örneğini yaratır,
 * 2) DB’den daha önce eklenen yaprakları yükler.
 */
async function initTree() {
    if (initialized) return
    initialized = true

    // Yeni IMT (hashFn=poseidon2, depth, zero, arity=2)
    tree = new IMT(poseidon2, TREE_DEPTH, ZERO_VALUE, 2)

    // DB’den kayıtlı yaprak sayısı
    const leafCount = parseInt(await db.get('leafCount').catch(() => '0'))
    for (let i = 0; i < leafCount; i++) {
        const leafStr = (await db.get(`leaf:${i}`)).toString()
        tree.insert(BigInt(leafStr))
    }
}

/**
 * Yeni yaprak ekler ve indeksi döner.
 */
export async function addLeaf(leafHash: bigint): Promise<number> {
    await initTree()
    const count = parseInt(await db.get('leafCount').catch(() => '0'), 10);


    // Ağaç’a ekle
    tree.insert(leafHash)

    // DB’yi güncelle
    await db.put('leafCount', (count + 1).toString())
    await db.put(`leaf:${count}`, leafHash.toString())
    await db.put('root', tree.root.toString())

    return count
}

/**
 * Belirli bir indeksteki yaprak için Merkle proof üretir.
 */
export async function generateProof(index: number) {
    await initTree()
    if (index < 0 || index >= tree.leaves.length) {
        throw new Error('Invalid leaf index')
    }

    const proof = tree.createProof(index)
    return {
        root: tree.root.toString(),
        siblings: proof.siblings.map((s: any) => s.toString()),
        pathIndices: proof.pathIndices
    }
}

/**
 * Şu anki Merkle root’unu döner.
 */
export async function getRoot(): Promise<string> {
    await initTree()
    return tree.root.toString()
}
