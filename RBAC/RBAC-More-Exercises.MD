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
