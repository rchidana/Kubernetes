# Some more Exercises on RBAC

1. Create a ClusterRole (secret-role) and ClusterRoleBinding (secret-role-binding) so that user secret@test.com can only access and manage secrets. Test it

```
k create clusterrole secret-role --verb="*" --resource=secret
k create clusterrolebinding secret-role-binding --user=secret@test.com --clusterrole=secret-role

# Test it
k auth can-i create secret --as secret@test.com # yes
k auth can-i "*" secret --as secret@test.com # yes
k auth can-i "*" pod --as secret@test.com # no
k auth can-i "*" svc --as secret@test.com # no

```

2. Create a ClusterRole (deploy-role) and ClusterRoleBinding (deploy-role-binding) so that user deploy@test.com can only deploy and manage pods named "compute". Test it.

```
k create clusterrole deploy-role --verb="*" --resource=pods --resource-name=compute
k create clusterrolebinding deploy-role-binding --user=deploy@test.com --clusterrole=deploy-role
k auth can-i "*" pod/compute --as deploy@test.com # yes
k auth can-i "*" pod/other-name --as deploy@test.com # no
```
