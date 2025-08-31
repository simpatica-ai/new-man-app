'use client'

   import { useState, useEffect, useCallback } from 'react';
   import { supabase } from '@/lib/supabaseClient';
   import Link from 'next/link';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
   import { Switch } from "@/components/ui/switch";
   import { Label } from "@/components/ui/label";
   import { Input } from "@/components/ui/input";

   type ConnectionDetails = {
     id: number;
     sponsor_name: string | null;
     journal_shared: boolean;
   };

   type Profile = {
     full_name: string | null;
   };

   export default function AccountSettingsPage() {
     const [loading, setLoading] = useState(true);
     const [connection, setConnection] = useState<ConnectionDetails | null>(null);
     const [fullName, setFullName] = useState<string>('');
     const [isEditingName, setIsEditingName] = useState(false);

     const fetchUserData = useCallback(async () => {
       try {
         setLoading(true);
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         // Fetch profile data
         const { data: profileData, error: profileError } = await supabase
           .from('profiles')
           .select('full_name')
           .eq('id', user.id)
           .single();

         if (profileError && profileError.code !== 'PGRST116') {
           throw profileError;
         }

         setFullName(profileData?.full_name || '');

         // Fetch sponsor connection details with corrected embed syntax
         const { data: connectionData, error: connectionError } = await supabase
           .from('sponsor_connections')
           .select('id,journal_shared,sponsor:profiles!sponsor_user_id(full_name)')
           .eq('practitioner_user_id', user.id)
           .eq('status', 'active')
           .single();
         
         console.log('connectionData:', connectionData);
         console.log('connectionError:', connectionError);

         if (connectionError) {
           if (connectionError.code !== 'PGRST116') {
             throw connectionError;
           }
           // No active connection, set to null
           setConnection(null);
         } else if (connectionData) {
           const sponsorName = connectionData.sponsor?.full_name || 'Unnamed Sponsor';
           setConnection({
             id: connectionData.id,
             sponsor_name: sponsorName,
             journal_shared: connectionData.journal_shared
           });
           if (!connectionData.sponsor?.full_name) {
             console.warn('Sponsor full_name is empty or null');
           }
         }
       } catch (error) {
         if (error instanceof Error) {
           alert(`Error fetching data: ${error.message}`);
         }
       } finally {
         setLoading(false);
       }
     }, []);

     useEffect(() => {
       fetchUserData();
     }, [fetchUserData]);

     const handleToggleSharing = async (isShared: boolean) => {
       if (!connection) return;

       setConnection({ ...connection, journal_shared: isShared });

       const { error } = await supabase
         .from('sponsor_connections')
         .update({ journal_shared: isShared })
         .eq('id', connection.id);

       if (error) {
         alert("Error updating sharing preference: " + error.message);
         setConnection({ ...connection, journal_shared: !isShared });
       }
     };

     const handleNameUpdate = async () => {
       try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         const { error } = await supabase
           .from('profiles')
           .upsert({ id: user.id, full_name: fullName.trim() || null })
           .eq('id', user.id);

         if (error) {
           throw error;
         }

         setIsEditingName(false);
         alert('Full name updated successfully!');
       } catch (error) {
         if (error instanceof Error) {
           alert("Error updating full_name: " + error.message);
         }
       }
     };

     if (loading) {
       return <div className="p-8 text-center">Loading settings...</div>;
     }

     return (
       <div className="container mx-auto p-4 max-w-2xl">
         <Link href="/" className="mb-4 inline-block">
           <Button variant="outline">&larr; Back to Dashboard</Button>
         </Link>
         <Card className="mb-6">
           <CardHeader>
             <CardTitle>Profile</CardTitle>
             <CardDescription>Manage your profile information.</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="flex items-center space-x-4">
               {isEditingName ? (
                 <>
                   <Input
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     placeholder="Enter your full name"
                     className="max-w-xs"
                   />
                   <Button onClick={handleNameUpdate} disabled={!fullName.trim()}>
                     Save
                   </Button>
                   <Button variant="outline" onClick={() => setIsEditingName(false)}>
                     Cancel
                   </Button>
                 </>
               ) : (
                 <>
                   <p className="text-gray-700">
                     <span className="font-medium">Full Name:</span> {fullName || 'Not set'}
                   </p>
                   <Button variant="outline" onClick={() => setIsEditingName(true)}>
                     {fullName ? 'Edit' : 'Add'} Name
                   </Button>
                 </>
               )}
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader>
             <CardTitle>Account Settings</CardTitle>
             <CardDescription>Manage your account and sharing preferences.</CardDescription>
           </CardHeader>
           <CardContent>
             {connection ? (
               <div className="flex items-center space-x-2">
                 <Switch
                   id="journal-sharing"
                   checked={connection.journal_shared}
                   onCheckedChange={handleToggleSharing}
                 />
                 <Label htmlFor="journal-sharing">
                   Share my journal and memos with my sponsor ({connection.sponsor_name || 'Sponsor'})
                 </Label>
               </div>
             ) : (
               <p className="text-gray-500">You do not have an active sponsor connection. Sharing settings are unavailable.</p>
             )}
           </CardContent>
         </Card>
       </div>
     );
   }