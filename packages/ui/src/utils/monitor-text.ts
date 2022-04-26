const text = {
  muteMonitor:
    "This will remove the node {selectedNode} from monitoring and automation.\nYou will no longer receive alerts for {selectedNode} and it will not be removed from rotation if it is out of sync.\nThis will not remove the node from its load balancer (if applicable).\nAre you sure you wish to mute node {selectedNode}?",
  unmuteMonitor:
    "This will add {selectedNode} to monitoring and automation.\nAre you sure you wish to unmute node {selectedNode}?",
  addToRotation:
    "This will enable {selectedNode} on its load balancer and open it up to traffic.\nAre you sure you wish to add {selectedNode} to rotation?",
  removeFromRotation:
    "This will disable {selectedNode} on its load balancer and stop it from receiving traffic.\nYou will still receive monitor alerts about {selectedNode}. Are you sure you wish to remove {selectedNode} from rotation?",
};

export default text;
