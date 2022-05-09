const text = {
  muteMonitor:
    'This will mute alerts for {selectedNode}.\nYou will no longer receive alerts for {selectedNode}. It will still be automatically added to and removed from rotation if out of sync.\nAre you sure you wish to mute node {selectedNode}?',
  unmuteMonitor:
    'This will resume alerts for {selectedNode}.\nAre you sure you wish to unmute node {selectedNode}?',
  addToRotation:
    'This will enable {selectedNode} on its load balancer and open it up to traffic.\nAre you sure you wish to add {selectedNode} to rotation?',
  removeFromRotation:
    'This will disable {selectedNode} on its load balancer and stop it from receiving traffic.\nYou will still receive monitor alerts about {selectedNode} if it is not muted. Are you sure you wish to remove {selectedNode} from rotation?',
};

export default text;
