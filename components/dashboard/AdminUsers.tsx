import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { User, UserRole } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassInputClass, ConfirmDialog } from './DashboardShared';

interface AdminUsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ users, setUsers }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  
  // Wallet modal state
  const [selectedUserForWallet, setSelectedUserForWallet] = useState<User | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAction, setWalletAction] = useState<'add' | 'deduct'>('add');
  const [walletAmount, setWalletAmount] = useState('');
  const [isWalletSubmitting, setIsWalletSubmitting] = useState(false);

  // Add User modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('customer');
  const [isAddUserSubmitting, setIsAddUserSubmitting] = useState(false);

  // Delete User confirmation state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Filters logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleWalletSubmit = async () => {
    if (!selectedUserForWallet) return;
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(t('admin_wallet_invalid_amount' as any) || 'Please enter a valid amount greater than 0');
      return;
    }

    if (walletAction === 'deduct' && selectedUserForWallet.balance < amount) {
      alert(t('admin_wallet_insufficient_deduct' as any) || 'Deduction exceeds user current balance');
      return;
    }

    setIsWalletSubmitting(true);
    try {
      await api.updateUserWallet(parseInt(selectedUserForWallet.id), walletAction, amount);
      
      setUsers(prev => prev.map(u => 
        u.id === selectedUserForWallet.id 
          ? { 
              ...u, 
              balance: walletAction === 'add' ? u.balance + amount : u.balance - amount 
            } 
          : u
      ));
      
      setIsWalletModalOpen(false);
      setWalletAmount('');
      setSelectedUserForWallet(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update user wallet balance');
    } finally {
      setIsWalletSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFirstName || !addLastName || !addEmail || !addPassword) {
      alert('All fields are required');
      return;
    }

    setIsAddUserSubmitting(true);
    try {
      const newUserRes = await api.createUser({
        first_name: addFirstName,
        last_name: addLastName,
        email: addEmail,
        password: addPassword,
        role: addRole,
      });

      const userData = newUserRes.user || newUserRes;
      const newUser: User = {
        id: String(userData.id),
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role as UserRole,
        balance: Number(userData.balance || 0),
        joinedDate: new Date(userData.created_at || Date.now()),
      };

      setUsers(prev => [...prev, newUser]);
      setIsAddUserModalOpen(false);
      
      // Reset form
      setAddFirstName('');
      setAddLastName('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('customer');
    } catch (err: any) {
      alert(err.message || 'Failed to add new user');
    } finally {
      setIsAddUserSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(parseInt(userToDelete.id));
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-serif text-white mb-1">{t('admin_users_title')}</h2>
          <p className="text-sm text-gray-300">{t('admin_users_subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="px-6 py-2.5 bg-white text-brand-dark font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-brand-gold hover:text-white transition-colors"
        >
          {t('admin_users_add_button' as any) || 'Add New User'}
        </button>
      </div>

      {/* Filters Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder={t('admin_users_search_placeholder' as any) || 'Search by name or email...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={glassInputClass}
          />
        </div>
        <div>
          <select
            value={selectedRoleFilter}
            onChange={e => setSelectedRoleFilter(e.target.value)}
            className={glassInputClass}
          >
            <option value="all" className="bg-gray-900 text-white">{t('admin_users_filter_all_roles' as any) || 'All Roles'}</option>
            <option value="customer" className="bg-gray-900 text-white">{t('signup_form_role_customer')}</option>
            <option value="designer" className="bg-gray-900 text-white">{t('signup_form_role_designer')}</option>
            <option value="tailor" className="bg-gray-900 text-white">{t('signup_form_role_tailor')}</option>
            <option value="manager" className="bg-gray-900 text-white">{t('signup_form_role_manager' as any) || 'Manager'}</option>
          </select>
        </div>
      </div>

      <div className={glassCardClass + " overflow-x-auto"}>
        <table className="w-full text-start min-w-0 sm:min-w-[600px]">
          <thead className="bg-white/5 text-gray-300 uppercase text-[9px] font-bold tracking-[0.15em] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-start">{t('admin_users_table_name')}</th>
              <th className="px-6 py-4 text-start">{t('admin_users_table_role')}</th>
              <th className="px-6 py-4 text-start">{t('admin_users_table_balance')}</th>
              <th className="px-6 py-4 text-end"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-brand-gold font-bold text-xs">
                      {u.firstName ? u.firstName[0] : ''}
                      {u.lastName ? u.lastName[0] : ''}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white leading-none mb-1">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[10px] text-gray-400 font-normal">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-start">
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    {t(`signup_form_role_${u.role}` as any)}
                  </span>
                </td>
                <td className="px-6 py-4 font-serif text-base font-medium text-white">
                  ${Number(u.balance).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-end">
                  <div className="flex justify-end gap-3 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => {
                        setSelectedUserForWallet(u);
                        setWalletAction('add');
                        setIsWalletModalOpen(true);
                      }}
                      className="text-white hover:text-brand-gold text-[10px] font-bold uppercase tracking-widest"
                    >
                      {t('admin_users_action_wallet')}
                    </button>
                    <button
                      onClick={() => {
                        setUserToDelete(u);
                        setIsDeleteConfirmOpen(true);
                      }}
                      className="text-red-400 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest"
                    >
                      {t('admin_users_action_delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">
                  {t('admin_users_no_users' as any) || 'No users found matching filters'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Wallet Deposit/Deduction Modal */}
      {isWalletModalOpen && selectedUserForWallet && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <div className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start my-4 max-h-[85vh] overflow-y-auto"}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-brand-gold font-bold text-xl">
                {selectedUserForWallet.firstName ? selectedUserForWallet.firstName[0] : ''}
              </div>
              <div>
                <h3 className="font-serif text-xl text-white">{t('admin_wallet_modal_title')}</h3>
                <p className="text-sm text-gray-300">
                  {selectedUserForWallet.firstName} {selectedUserForWallet.lastName}
                </p>
              </div>
            </div>
            <div className="p-5 bg-white/5 rounded-2xl mb-6 text-center border border-white/10">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_wallet_current_balance')}
              </p>
              <p className="text-4xl font-serif text-white font-bold">
                ${Number(selectedUserForWallet.balance).toFixed(2)}
              </p>
            </div>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {t('admin_wallet_action_label')}
                </label>
                <select
                  className={glassInputClass}
                  value={walletAction}
                  onChange={e => setWalletAction(e.target.value as any)}
                >
                  <option value="add" className="bg-gray-800 text-white">
                    {t('admin_wallet_action_add')}
                  </option>
                  <option value="deduct" className="bg-gray-800 text-white">
                    {t('admin_wallet_action_deduct')}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {t('admin_wallet_amount_label')}
                </label>
                <input
                  type="number"
                  className={glassInputClass}
                  placeholder="0.00"
                  value={walletAmount}
                  onChange={e => setWalletAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsWalletModalOpen(false)}
                className="flex-1 py-4 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                onClick={handleWalletSubmit}
                disabled={isWalletSubmitting}
                className="flex-1 py-4 bg-white text-black rounded-xl shadow-lg font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isWalletSubmitting ? t('wallet_processing') : t('admin_wallet_submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
          <form
            onSubmit={handleAddUserSubmit}
            className={glassCardClass + " p-6 sm:p-8 max-w-md w-full text-start space-y-4 my-4 max-h-[85vh] overflow-y-auto"}
          >
            <h3 className="font-serif text-2xl text-white mb-4">
              {t('admin_users_add_modal_title' as any) || 'Create New Account'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {t('contact_form_firstName')}
                </label>
                <input
                  type="text"
                  required
                  value={addFirstName}
                  onChange={e => setAddFirstName(e.target.value)}
                  className={glassInputClass}
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {t('contact_form_lastName')}
                </label>
                <input
                  type="text"
                  required
                  value={addLastName}
                  onChange={e => setAddLastName(e.target.value)}
                  className={glassInputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('contact_form_email')}
              </label>
              <input
                type="email"
                required
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                className={glassInputClass}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('signup_form_password_label' as any) || 'Password'}
              </label>
              <input
                type="password"
                required
                value={addPassword}
                onChange={e => setAddPassword(e.target.value)}
                className={glassInputClass}
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                {t('admin_users_table_role')}
              </label>
              <select
                className={glassInputClass}
                value={addRole}
                onChange={e => setAddRole(e.target.value as UserRole)}
              >
                <option value="customer" className="bg-gray-800 text-white">
                  {t('signup_form_role_customer')}
                </option>
                <option value="designer" className="bg-gray-800 text-white">
                  {t('signup_form_role_designer')}
                </option>
                <option value="tailor" className="bg-gray-800 text-white">
                  {t('signup_form_role_tailor')}
                </option>
                <option value="manager" className="bg-gray-800 text-white">
                  {t('signup_form_role_manager' as any) || 'Manager'}
                </option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="flex-1 py-3 text-gray-400 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
              >
                {t('modal_cancel')}
              </button>
              <button
                type="submit"
                disabled={isAddUserSubmitting}
                className="flex-1 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-brand-gold hover:text-white transition-colors disabled:opacity-50"
              >
                {isAddUserSubmitting ? t('wallet_processing') : t('signup_form_submit_label' as any) || 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Unified Deletion Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title={t('admin_users_delete_confirm' as any) || 'Delete User'}
        message={`${t('admin_users_delete_warning' as any) || 'Are you sure you want to permanently delete user account:'} ${userToDelete?.firstName} ${userToDelete?.lastName}?`}
        confirmText={t('admin_users_action_delete')}
        cancelText={t('modal_cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
};
