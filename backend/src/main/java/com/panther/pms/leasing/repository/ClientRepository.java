package com.panther.pms.leasing.repository;

import com.panther.pms.leasing.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long>, JpaSpecificationExecutor<Client> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Client> findByEmailIgnoreCase(String email);
}
