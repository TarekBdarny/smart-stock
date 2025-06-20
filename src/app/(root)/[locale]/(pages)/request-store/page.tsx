"use client";
import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useRef,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  ArrowUpRight,
  Home,
  Send,
  ShieldCheck,
  Store,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import {
  isAdmin,
  isAllowedToBecomeAnOwner,
  isAllowedToCreateStore,
} from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const StorePage = () => {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = useQuery(api.users.current);
  const generateUploadUrl = useMutation(api.file.generateUploadUrl);
  const createStoreRequest = useMutation(api.storeRequest.createStoreRequest);
  const formSchema = z.object({
    storeName: z
      .string()
      .min(4, "Store name must be 4 characters or more")
      .max(30, "Store name must be 30 characters or less"),
    location: z
      .string()
      .min(4, "Location must be 4 characters or more")
      .max(30, "Location must be 30 characters or less"),
    workHours: z
      .string()
      .min(4, "Work hours must be 4 characters or more")
      .max(15, "Work hours must be 15 characters or less"),
    storeImage: z.string().optional(),
    bio: z
      .string()
      .min(10, "Bio must be 10 characters or more")
      .max(100, "Bio must be 100 characters or less"),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bio: "",
      storeName: "",
      location: "",
      workHours: "",
      storeImage: "",
    },
  });

  if (!currentUser) return;

  if (isAdmin(currentUser)) {
    return <NotAllowed text="Admin's cannot request a store." isAdmin />;
  }
  if (!isAllowedToBecomeAnOwner(currentUser)) {
    return (
      <NotAllowed text="Store owners can have only 1 store." isAdmin={false} />
    );
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string); // base64 string
      };
      reader.readAsDataURL(file); // Read file as Data URL
    } else {
      setSelectedImage(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const postUrl = await generateUploadUrl();
    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      headers: { "Content-Type": selectedImage!.type },
      method: "POST",
      body: selectedImage,
    });
    const { storageId } = await result.json();

    const { storeName, bio, location, workHours } = values;

    createStoreRequest({
      storeName,
      bio,
      location,
      workHours,
      storeImageStorageId: selectedImage
        ? (storageId as Id<"_storage">)
        : undefined,
    });
    setOpen(false);
    toast.success("Store request submitted successfully.");
    router.push("/");
  };

  return (
    <section className="mx-auto w-3/4 md:w-2xl lg:w-4xl px-5 mt-10">
      <Card className="py-0">
        <div className="flex flex-col md:flex-row w-full md:justify-between">
          <CardContent className="py-5 my-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="El Pastry ..." {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public store display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="This shop sells delicious pastries"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Sakhnin Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Hours</FormLabel>
                      <FormControl>
                        <Input placeholder="7am - 10pm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="storeImage"
                  render={() => (
                    <FormItem>
                      <FormLabel>Store Profile Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleInputChange}
                          disabled={selectedImage !== null}
                          // {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <StoreDialog
                  onClick={form.handleSubmit(handleSubmit)}
                  open={open}
                  setOpen={setOpen}
                />
              </form>
            </Form>
          </CardContent>
          <div className="">
            {imagePreview ? (
              <Image
                className="rounded-md rounded-l-none hidden md:block"
                src={imagePreview}
                alt="preview store imae"
                style={{
                  height: "100%",
                  objectFit: "cover",
                }}
                width={400}
                height={700}
              />
            ) : (
              <div>Please select an image</div>
            )}
          </div>
        </div>
      </Card>
      <span className="text-sm px-3 ">
        This form will send a request to the admins and after the admin approval
        the store will be active (you will be notified by email).
      </span>
    </section>
  );
};

const StoreDialog = ({
  onClick,
  open,
  setOpen,
}: {
  onClick: () => void;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={() => setOpen((prev) => !prev)}>
      <AlertDialogTrigger asChild>
        <Button
          variant="action"
          className="w-full"
          onClick={() => console.log("Hello")}
        >
          Send Request
          <Send />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-4xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Store Opening Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to send a request to open a new store? Our
            team will review your request and notify you once it&apos;s
            approved. This action cannot be undone. Before proceeding, please
            make sure you’ve read and agreed to our
            <Link href="/terms" className="underline text-primary">
              Terms of Service
            </Link>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction type="submit" onClick={onClick}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
const NotAllowed = ({ text, isAdmin }: { text: string; isAdmin: boolean }) => {
  return (
    <div className=" w-full bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10">
            {isAdmin ? (
              <ShieldCheck className="h-8 w-8 text-destructive" />
            ) : (
              <Store className="h-8 w-8 text-destructive" />
            )}
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              Store Request Not Available
            </CardTitle>
            <CardDescription className="text-base">{text}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Role Badge */}
          <div className="flex justify-center">
            <Badge
              variant={isAdmin ? "destructive" : "secondary"}
              className="text-sm"
            >
              {isAdmin ? "Administrator" : "Store Owner"}
            </Badge>
          </div>

          {/* Information Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isAdmin
                ? "Use the admin dashboard to manage all stores and system settings."
                : "Manage your existing store through the store dashboard or contact support for additional store requests."}
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <Button asChild variant={"action"} className="w-full" size="lg">
            <Link href={"/"}>
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href={"/dashboard"}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Visit Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
export default StorePage;
