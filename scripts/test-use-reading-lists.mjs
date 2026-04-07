import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';

// --- Lightweight React Mocking Setup ---
const sourcePath = path.resolve('./src/useReadingLists.js');
const originalCode = fs.readFileSync(sourcePath, 'utf-8');

// Replace the React import with our mock implementations
const modifiedCode = originalCode.replace(
  /import \{.*?\} from 'react';/,
  `
  // Mock React Hooks
  export function useState(initial) {
    if (global.__mockReactState === undefined) {
      global.__mockReactState = typeof initial === 'function' ? initial() : initial;
    }
    const setState = (updater) => {
      global.__mockReactState = typeof updater === 'function'
        ? updater(global.__mockReactState)
        : updater;
    };
    return [global.__mockReactState, setState];
  }
  export function useEffect() {}
  export function useCallback(fn) { return fn; }
  export function useMemo(fn) { return fn(); }
  `
);

const b64 = Buffer.from(modifiedCode).toString('base64');
const moduleUrl = `data:text/javascript;base64,${b64}`;

// --- Tests ---
async function runTests() {
  const { useReadingLists } = await import(moduleUrl);

  // Helper to initialize the hook with a specific state
  function setupHook(initialState = {}) {
    global.localStorage = {
      getItem: () => JSON.stringify(initialState),
      setItem: () => {}
    };
    global.__mockReactState = undefined;

    // First render
    let hook = useReadingLists();

    return {
      getLists: () => global.__mockReactState,
      addToList: (...args) => {
        hook.addToList(...args);
        hook = useReadingLists(); // Re-render
      },
      toggleList: (...args) => {
        hook.toggleList(...args);
        hook = useReadingLists(); // Re-render
      }
    };
  }

  // 1. addToList: adding a book to a list
  {
    const hook = setupHook({});
    hook.addToList('book1', 'want');
    assert.deepEqual(hook.getLists(), { book1: 'want' }, 'Should add book to list');
  }

  // 2. addToList: moving a book from one list to another
  {
    const hook = setupHook({ book1: 'want' });
    hook.addToList('book1', 'read');
    assert.deepEqual(hook.getLists(), { book1: 'read' }, 'Should move book to new list');
  }

  // 3. toggleList: toggling on when the book is not in that list
  {
    const hook = setupHook({});
    hook.toggleList('book2', 'reading');
    assert.deepEqual(hook.getLists(), { book2: 'reading' }, 'Should add book when toggling on');
  }

  // 4. toggleList: toggling off when the book is already in that list
  {
    const hook = setupHook({ book2: 'reading' });
    hook.toggleList('book2', 'reading');
    assert.deepEqual(hook.getLists(), {}, 'Should remove book when toggling off');
  }

  // 5. preserving other book-to-list mappings
  {
    const hook = setupHook({ bookA: 'read', bookB: 'want' });
    hook.addToList('bookC', 'reading');
    assert.deepEqual(
      hook.getLists(),
      { bookA: 'read', bookB: 'want', bookC: 'reading' },
      'Should preserve other mappings when adding'
    );

    hook.toggleList('bookA', 'read');
    assert.deepEqual(
      hook.getLists(),
      { bookB: 'want', bookC: 'reading' },
      'Should preserve other mappings when toggling off'
    );
  }

  // 6. toggling to a different list when already in another list
  {
    const hook = setupHook({ bookX: 'want' });
    hook.toggleList('bookX', 'read');
    assert.deepEqual(hook.getLists(), { bookX: 'read' }, 'Should switch to new list if toggling a different list');
  }

  console.log('test:use-reading-lists OK');
}

runTests().catch(err => {
  console.error('Tests failed:', err);
  process.exit(1);
});
