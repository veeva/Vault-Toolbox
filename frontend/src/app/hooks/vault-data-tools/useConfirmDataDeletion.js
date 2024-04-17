import { useState } from 'react';

export default function useConfirmDataDeletion() {
    const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

    const closeConfirmDeleteModal = () => {
        setIsConfirmDeleteModalOpen(false);
    };

    return { isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen, closeConfirmDeleteModal, deleteConfirmationText, setDeleteConfirmationText }
}