
Install Go & make (if not present)

```
# Need to have root privilege to perform this
sudo su # If not root
curl -OL  https://go.dev/dl/go1.22.3.linux-amd64.tar.gz \
&&  rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.3.linux-amd64.tar.gz \
&& export PATH=$PATH:/usr/local/go/bin

# Install make (if not present)
sudo apt-get install make
```

Check go version
```
go version

#If go is not on PATH
export PATH=$PATH:/usr/local/go/bin
go version
```

Download & Install kubebuilder
```
# Need root privilege 
curl -L -o kubebuilder "https://go.kubebuilder.io/dl/latest/$(go env GOOS)/$(go env GOARCH)"
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/

# check kubebuilder version
kubebuilder version

```

Create a folder - my-operator - and this will hold all code for my operator

```
mkdir my-operator
cd my-operator
```

Scaffold a kubebuilder application in this folder - my-operator

```
# Check out the complete syntax for initializing a project
kubebuilder init --help

kubebuilder init --domain my.domain --repo my.domain/tutorial

# Check out all the files & folders that are created

# Dockerfile --> Instructions to build the Operator's image
# Makefile --> Helper commands & targets
# cmd/main.go --> Entrypoint of our project

# Create Foo API
kubebuilder create api --group tutorial --version v1 --kind Foo
# Yes to creating Resource & Controller

# Check out additional files that get created

# api/v1 contains the definition of the 'Foo' CRD
# internal/controller contains the logic of the 'Foo' controller

```

Let us customize the CRD Foo - Add a 'name' field in its spec which refers to the name of the friend Foo is looking for. <br>
If Foo finds a friend (a pod with the same name as his), its 'happy' status will be set to true. <br>

# Modify/Replace api/v1/foo_types.go with the following code

```
package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// FooSpec defines the desired state of Foo
type FooSpec struct {
	// Name of the friend Foo is looking for
	Name string `json:"name"`
}

// FooStatus defines the observed state of Foo
type FooStatus struct {
	// Happy will be set to true if Foo found a friend
	// +optional
	Happy bool `json:"happy,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status

// Foo is the Schema for the foos API
type Foo struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   FooSpec   `json:"spec,omitempty"`
	Status FooStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// FooList contains a list of Foo
type FooList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Foo `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Foo{}, &FooList{})
}
```

# Add logic to our controller - to check running Pods & if Pod with same name found, update 'happy' status

# Replace internal/controller/foo_controller.go with the following:

```
package controller

import (
	"context"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	tutorialv1 "my.domain/tutorial/api/v1"
)

// FooReconciler reconciles a Foo object
type FooReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// RBAC permissions to monitor foo custom resources
//+kubebuilder:rbac:groups=tutorial.my.domain,resources=foos,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=tutorial.my.domain,resources=foos/status,verbs=get;update;patch

// RBAC permissions to monitor pods
//+kubebuilder:rbac:groups="",resources=pods,verbs=get;list;watch

// Reconcile is part of the main kubernetes reconciliation loop which aims to
// move the current state of the cluster closer to the desired state.
func (r *FooReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)
	log.Info("reconciling foo custom resource")

	// Get the Foo resource that triggered the reconciliation request
	var foo tutorialv1.Foo
	if err := r.Get(ctx, req.NamespacedName, &foo); err != nil {
		log.Error(err, "unable to fetch Foo")
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	// Get pods with the same name as Foo's friend
	var podList corev1.PodList
	var friendFound bool
	if err := r.List(ctx, &podList); err != nil {
		log.Error(err, "unable to list pods")
	} else {
		for _, item := range podList.Items {
			if item.GetName() == foo.Spec.Name {
				log.Info("pod linked to a foo custom resource found", "name", item.GetName())
				friendFound = true
			}
		}
	}

	// Update Foo' happy status
	foo.Status.Happy = friendFound
	if err := r.Status().Update(ctx, &foo); err != nil {
		log.Error(err, "unable to update foo's happy status", "status", friendFound)
		return ctrl.Result{}, err
	} else {
		log.Info("foo's happy status updated", "status", friendFound)
	}

	log.Info("foo custom resource reconciled")
	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *FooReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&tutorialv1.Foo{}).
		Watches(
			&corev1.Pod{},
			handler.EnqueueRequestsFromMapFunc(r.mapPodsReqToFooReq),
		).
		Complete(r)
}

func (r *FooReconciler) mapPodsReqToFooReq(ctx context.Context, pod client.Object) []reconcile.Request {
	log := log.FromContext(ctx)

	// List all the Foo custom resource
	req := []reconcile.Request{}
	var list tutorialv1.FooList
	if err := r.Client.List(ctx, &list); err != nil {
		log.Error(err, "unable to list foo custom resources")
	} else {
		// Only keep Foo custom resources related to the Pod that triggered the reconciliation request
		for _, item := range list.Items {
			if item.Spec.Name == pod.GetName() {
				req = append(req, reconcile.Request{
					NamespacedName: types.NamespacedName{Name: item.Name, Namespace: item.Namespace},
				})
				log.Info("pod linked to a foo custom resource issued an event", "name", pod.GetName())
			}
		}
	}
	return req
}
```

# Let us now create manifests 

```
# Run this from my-operator folder
make Install

# If make gets stuck, try to run it with --debug

# Once make completes, check if our CRD is created
kubectl get crds

# Let us now run our operator
make run 

```

# Let us try our operator by first creating the following crds

```
cat<<EOF | kubectl apply -f -
---
apiVersion: tutorial.my.domain/v1
kind: Foo
metadata:
  name: foo-01
  labels:
    app.kubernetes.io/name: foo
    app.kubernetes.io/instance: foo-sample
    app.kubernetes.io/part-of: operator-v1
    app.kubernetes.io/managed-by: kustomize
    app.kubernetes.io/created-by: operator-v1
spec:
  name: jack

---
apiVersion: tutorial.my.domain/v1
kind: Foo
metadata:
  name: foo-02
  labels:
    app.kubernetes.io/name: foo
    app.kubernetes.io/instance: foo-sample
    app.kubernetes.io/part-of: operator-v1
    app.kubernetes.io/managed-by: kustomize
    app.kubernetes.io/created-by: operator-v1
spec:
  name: joe
EOF

```
# Check out the logging information from our operator

```
k describe crds
```

# Let us deploy a pod with name 'jack' and check out the behaviour of our operator

```
cat<<EOF | microk8s.kubectl apply -f -
---
apiVersion: v1
kind: Pod
metadata:
  name: jack
spec:
  containers:
  - name: ubuntu
    image: ubuntu:latest
    # Just sleep forever
    command: [ "sleep" ]
    args: [ "infinity" ]
EOF
```

# Check the logs for this message -->  INFO    foo's happy status updated

Complete tutorial : https://betterprogramming.pub/build-a-kubernetes-operator-in-10-minutes-11eec1492d30 <br>
