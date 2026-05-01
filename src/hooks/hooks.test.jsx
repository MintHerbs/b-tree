// Test file for hooks - demonstrates API usage
import { useBPlusTree } from './useBPlusTree.js'
import { useAnimationPlayer } from './useAnimationPlayer.js'

// This is a demonstration of the hook APIs
// In a real React component, these would be used like:

function ExampleTreeComponent() {
  // Initialize tree with values and order
  const {
    tree,
    steps,
    isInitialized,
    stats,
    initializeTree,
    insert,
    deleteValues,
    resetTree
  } = useBPlusTree([], 3)

  // Initialize on mount
  // useEffect(() => {
  //   initializeTree([5, 3, 8, 1, 9], 3)
  // }, [])

  // Use animation player with the steps
  const {
    currentStepIndex,
    currentStep,
    isPlaying,
    speed,
    isAtStart,
    isAtEnd,
    hasSteps,
    totalSteps,
    play,
    pause,
    togglePlayPause,
    next,
    prev,
    goToStep,
    updateSpeed,
    reset
  } = useAnimationPlayer(steps)

  // Example operations:
  // - initializeTree([5, 3, 8], 3) - build tree with initial values
  // - insert([42, 7]) - insert new values
  // - deleteValues([5]) - delete values
  // - resetTree([1, 2, 3], 4) - reset with new values and order
  
  // Animation controls:
  // - play() - start animation
  // - pause() - pause animation
  // - togglePlayPause() - toggle play/pause
  // - next() - go to next step
  // - prev() - go to previous step
  // - goToStep(5) - jump to specific step
  // - updateSpeed(1.5) - change playback speed
  // - reset() - go back to first step

  // Current state:
  // - tree - the BPlusTree instance
  // - stats - { order, nodeCount, keyCount, height }
  // - currentStep - current animation step object
  // - currentStepIndex - index of current step
  // - isPlaying - whether animation is playing
  // - totalSteps - total number of steps

  return null // This is just a demonstration
}

console.log('=== Hook API Documentation ===')
console.log('')
console.log('useBPlusTree(initialValues, order):')
console.log('  Returns: { tree, steps, isInitialized, stats, initializeTree, insert, deleteValues, resetTree }')
console.log('  - tree: BPlusTree instance')
console.log('  - steps: Array of animation step objects')
console.log('  - isInitialized: boolean')
console.log('  - stats: { order, nodeCount, keyCount, height }')
console.log('  - initializeTree(values, order): Initialize tree')
console.log('  - insert(values): Insert values (array or single value)')
console.log('  - deleteValues(values): Delete values (array or single value)')
console.log('  - resetTree(values, order): Reset tree')
console.log('')
console.log('useAnimationPlayer(steps):')
console.log('  Returns: { currentStepIndex, currentStep, isPlaying, speed, isAtStart, isAtEnd, hasSteps, totalSteps, play, pause, togglePlayPause, next, prev, goToStep, updateSpeed, reset }')
console.log('  - currentStepIndex: number')
console.log('  - currentStep: step object or null')
console.log('  - isPlaying: boolean')
console.log('  - speed: number (0.5 to 2.0)')
console.log('  - isAtStart: boolean')
console.log('  - isAtEnd: boolean')
console.log('  - hasSteps: boolean')
console.log('  - totalSteps: number')
console.log('  - play(): Start animation')
console.log('  - pause(): Pause animation')
console.log('  - togglePlayPause(): Toggle play/pause')
console.log('  - next(): Go to next step')
console.log('  - prev(): Go to previous step')
console.log('  - goToStep(index): Jump to specific step')
console.log('  - updateSpeed(speed): Change playback speed')
console.log('  - reset(): Go back to first step')
console.log('')
console.log('Step object structure:')
console.log('  {')
console.log('    id: number,')
console.log('    description: string,')
console.log('    treeSnapshot: { t, root },')
console.log('    highlightNodeId: string | null,')
console.log('    highlightKeys: string[],')
console.log('    arrowFrom: { x, y } | null,')
console.log('    arrowTo: { x, y } | null,')
console.log('    arrowLabel: string | null,')
console.log('    type: "traverse" | "insert" | "split" | "delete" | "borrow" | "merge" | "done"')
console.log('  }')
